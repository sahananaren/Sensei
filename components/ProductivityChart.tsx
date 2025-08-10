import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, Pressable, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { WeeklyData } from '@/hooks/useProductivityData';

interface ProductivitySession {
  id: string;
  habit_id: string;
  vision_id: string;
  duration_minutes: number;
  completed_at: string;
  habit: {
    id: string;
    name: string;
  };
  vision: {
    id: string;
    name: string;
    color: string;
  };
}

interface ProductivityChartProps {
  weekData: WeeklyData[];
  sessions: ProductivitySession[];
  height?: number;
}

// Helper function to generate curved path for smooth lines
function getCurvedPathD(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    if (i === 1) {
      // First curve
      const cp1x = prev.x + (curr.x - prev.x) * 0.3;
      const cp1y = prev.y;
      const cp2x = curr.x - (curr.x - prev.x) * 0.3;
      const cp2y = curr.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    } else {
      // Subsequent curves
      const prevPrev = points[i - 2];
      const cp1x = prev.x + (curr.x - prevPrev.x) * 0.15;
      const cp1y = prev.y;
      const cp2x = curr.x - (curr.x - prev.x) * 0.3;
      const cp2y = curr.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
  }
  
  return path;
}

interface TooltipContent {
  date: string;
  totalHours: string;
  breakdown: Array<{
    name: string;
    hours: string;
    color?: string;
  }>;
}

interface ProductivityChartTooltipProps {
  visible: boolean;
  position: { x: number; y: number };
  content: TooltipContent | null;
  onClose: () => void;
}

function ProductivityChartTooltip({ visible, position, content, onClose }: ProductivityChartTooltipProps) {
  if (!content) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.tooltipOverlay} onPress={onClose}>
        <View 
          style={[
            styles.tooltipContainer,
            {
              left: Math.max(10, Math.min(position.x - 100, Dimensions.get('window').width - 220)),
              top: Math.max(10, position.y - 2), // Position 2px above the node
            }
          ]}
        >
          <Text style={styles.tooltipDate} numberOfLines={1}>{content.date}</Text>
          <Text style={styles.tooltipTotal} numberOfLines={1}>{content.totalHours}</Text>
          
          <View style={styles.tooltipDivider} />
          
          {content.breakdown.map((item, index) => (
            <View key={index} style={styles.tooltipBreakdownItem}>
              {item.color && (
                <View style={[styles.tooltipColorDot, { backgroundColor: item.color }]} />
              )}
              <Text style={styles.tooltipBreakdownName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.tooltipBreakdownHours} numberOfLines={1}>{item.hours}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

export function ProductivityChart({ weekData, sessions, height = 400 }: ProductivityChartProps) {
  const chartWidth = 360;
  const chartHeight = height - 79; // Leave space for labels only
  const leftPadding = 40; // Left padding for Y-axis labels
  const rightPadding = 24; // Right padding as requested
  const topPadding = 20; // Top padding (reduced from leftPadding)
  const bottomPadding = leftPadding; // Bottom padding (keep same as left)
  
  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Calculate actual max minutes from data
  const actualMaxMinutes = Math.max(...weekData.map(day => day.totalMinutes));
  
  // Dynamic Y-axis scale based on actual data
  const getDisplayMaxMinutes = (actualMax: number) => {
    if (actualMax <= 300) return 300; // 5 hours
    if (actualMax <= 600) return 600; // 10 hours
    if (actualMax <= 900) return 900; // 15 hours
    if (actualMax <= 1200) return 1200; // 20 hours
    return 1500; // 25 hours
  };
  
  const maxMinutes = getDisplayMaxMinutes(actualMaxMinutes);
  
  // Convert maxMinutes to hours for Y-axis label calculation
  const maxHours = Math.ceil(maxMinutes / 60);
  
  // Get unique visions across the week
  const uniqueVisions = new Map<string, { name: string; color: string }>();
  weekData.forEach(day => {
    Object.entries(day.visionData).forEach(([visionId, data]) => {
      if (!uniqueVisions.has(visionId)) {
        uniqueVisions.set(visionId, { name: data.name, color: data.color });
      }
    });
  });
  
  // Calculate points for each vision line
  const visionLines = Array.from(uniqueVisions.entries()).map(([visionId, visionInfo], visionIndex) => {
    const visionPoints = weekData.map((day, index) => {
      const x = leftPadding + (index * (chartWidth - leftPadding - rightPadding)) / (weekData.length - 1);
      const visionMinutes = day.visionData[visionId]?.minutes || 0;
      const y = chartHeight - bottomPadding - ((visionMinutes / maxMinutes) * (chartHeight - topPadding - bottomPadding));
      return { x, y };
    });
    
    // Create area path for gradient fill
    const areaPathD = getCurvedPathD(visionPoints) + 
      ` L ${visionPoints[visionPoints.length - 1].x} ${chartHeight - bottomPadding}` +
      ` L ${visionPoints[0].x} ${chartHeight - bottomPadding} Z`;
    
    return {
      id: visionId,
      name: visionInfo.name,
      color: visionInfo.color,
      points: visionPoints,
      pathD: getCurvedPathD(visionPoints),
      areaPathD,
    };
  });
  
  // Y-axis labels (time) - 2 hour intervals up to 20 hours
  const yLabels = [];
  
  const interval = maxHours <= 10 ? 1 : 2; // 1-hour intervals under 10 hours, 2-hour intervals above

  // Generate interval labels
  for (let hours = 0; hours <= maxHours; hours += interval) {
    const minutes = hours * 60;
    if (minutes <= maxMinutes) {
      const y = chartHeight - bottomPadding - ((minutes / maxMinutes) * (chartHeight - topPadding - bottomPadding));
      const label = hours === 0 ? '0' : `${hours}h`;
      yLabels.push({ y, label, minutes });
    }
  }

  // Calculate cumulative productivity line
  const cumulativePoints = weekData.map((day, index) => {
    const x = leftPadding + (index * (chartWidth - leftPadding - rightPadding)) / (weekData.length - 1);
    const y = chartHeight - bottomPadding - ((day.totalMinutes / maxMinutes) * (chartHeight - topPadding - bottomPadding));
    return { x, y };
  });
  
  const cumulativePathD = getCurvedPathD(cumulativePoints);
  
  const handlePointPress = (dayIndex: number, type: 'vision' | 'cumulative', visionId?: string, x?: number, y?: number) => {
    // Only show tooltip for cumulative graphs
    if (type !== 'cumulative') return;
    
    const dayData = weekData[dayIndex];
    const date = new Date(dayData.date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const totalMinutes = dayData.totalMinutes;
    const totalHours = totalMinutes < 60 
      ? `${totalMinutes} mins`
      : `${(totalMinutes / 60).toFixed(1)} hrs`;
    
    const breakdown = Object.entries(dayData.visionData).map(([visionId, data]) => ({
      name: data.name,
      hours: data.minutes < 60 
        ? `${data.minutes} mins`
        : `${(data.minutes / 60).toFixed(1)} hrs`,
      color: data.color,
    }));
    
    const content: TooltipContent = {
      date,
      totalHours,
      breakdown,
    };
    
    setTooltipContent(content);
    setTooltipPosition({ x: x || 0, y: y || 0 });
    setShowTooltip(true);
  };
  
  return (
    <>
      <View style={styles.container}>
        <Svg width={chartWidth} height={height - 46} style={styles.chart}>
          <Defs>
            {visionLines.map((visionLine, index) => (
              <LinearGradient key={visionLine.id} id={`visionGradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={visionLine.color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={visionLine.color} stopOpacity="0" />
              </LinearGradient>
            ))}
          </Defs>
          
          {/* Grid lines */}
          {yLabels.map((label, index) => (
            <Line
              key={index}
              x1={leftPadding}
              y1={label.y}
              x2={chartWidth - rightPadding}
              y2={label.y}
              stroke="#1C1C1C"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Y-axis labels */}
          {yLabels.map((label, index) => (
            <SvgText
              key={index}
              x={leftPadding - 20}
              y={label.y + 4}
              fontSize="12"
              fill="#A7A7A7"
              textAnchor="end"
              fontFamily="Inter-Regular"
            >
              {label.label}
            </SvgText>
          ))}
          
          {/* Individual vision areas with gradients */}
          {visionLines.map((visionLine, index) => (
            <G key={visionLine.id}>
              {/* Area with gradient */}
              <Path
                d={visionLine.areaPathD}
                fill={`url(#visionGradient${index})`}
              />
              {/* Dotted line */}
              <Path
                d={visionLine.pathD}
                fill="none"
                stroke={visionLine.color}
                strokeWidth="2"
                strokeOpacity="0.5"
                strokeDasharray="3,3"
              />
            </G>
          ))}
          
          {/* Cumulative productivity line */}
          <Path
            d={cumulativePathD}
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
          
          {/* Visible dots for vision lines - smaller and non-clickable */}
          {visionLines.map((visionLine) => 
            visionLine.points.map((point, index) => (
              <Circle
                key={`${visionLine.id}-dot-${index}`}
                cx={point.x}
                cy={point.y}
                r="2"
                fill={visionLine.color}
                stroke="#0A0A0A"
                strokeWidth="1"
              />
            ))
          )}
          
          {/* Visible dots for cumulative line - bigger and clickable */}
          {cumulativePoints.map((point, index) => (
            <Circle
              key={`cumulative-dot-${index}`}
              cx={point.x}
              cy={point.y}
              r="6"
              fill="white"
              stroke="#0A0A0A"
              strokeWidth="2"
            />
          ))}
          
          {/* X-axis labels */}
          {weekData.map((day, index) => {
            const x = (leftPadding - 12 + 20) + (index * (chartWidth - leftPadding - rightPadding)) / (weekData.length - 0.8);
            return (
            <SvgText
              key={day.date}
              x={x}
              y={chartHeight }
              fontSize="12"
              fill="#A7A7A7"
              textAnchor="middle"
              fontFamily="Inter-Regular"
            >
              {day.dayName}
            </SvgText>
            );
          })}
        </Svg>
        
        {/* Pressable overlays for cumulative data points only */}
        {cumulativePoints.map((point, index) => (
          <Pressable
            key={`cumulative-pressable-${index}`}
            style={[
              styles.dataPointOverlay,
              {
                left: point.x - 30, // Increased touch area for bigger nodes
                top: point.y - 30,
              }
            ]}
            onPress={() => handlePointPress(index, 'cumulative', undefined, point.x, point.y)}
          />
        ))}
        
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItems}>
            {/* All Visions (cumulative) */}
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'white' }]} />
              <Text style={styles.legendText}>All Visions</Text>
            </View>
            
            {/* Individual visions */}
            {Array.from(uniqueVisions.entries()).map(([visionId, visionInfo]) => (
              <View key={visionId} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: visionInfo.color }]} />
                <Text style={styles.legendText}>{visionInfo.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      <ProductivityChartTooltip
        visible={showTooltip}
        position={tooltipPosition}
        content={tooltipContent}
        onClose={() => setShowTooltip(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    position: 'relative',
    pointerEvents: 'box-none',
  },
  chart: {
    backgroundColor: 'transparent',
  },
  dataPointOverlay: {
    position: 'absolute',
    width: 60, // Increased from 44 to 60 for bigger touch area
    height: 60, // Increased from 44 to 60 for bigger touch area
    backgroundColor: 'transparent',
    pointerEvents: 'auto',
  },
  legend: {
    marginTop: 0,
    paddingTop: 16,
    paddingLeft: 12,
    paddingBottom: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#1C1C1C',
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    width: 200, // Fixed width instead of minWidth
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  tooltipTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  tooltipDivider: {
    height: 1,
    backgroundColor: '#444444',
    marginBottom: 12,
  },
  tooltipBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 20, // Ensure consistent height
  },
  tooltipColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    flexShrink: 0, // Prevent shrinking
  },
  tooltipBreakdownName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginRight: 8, // Add space between name and hours
  },
  tooltipBreakdownHours: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    flexShrink: 0, // Prevent shrinking
  },
});