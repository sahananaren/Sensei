import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Target, ChartBar as BarChart3, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { useEffect } from 'react';

const TAB_WIDTH = 80;
const TAB_BAR_HEIGHT = 80;

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
  name: string;
}

function TabBarIcon({ focused, color, size, name }: TabBarIconProps) {
  const icons = {
    index: Calendar,
    mastery: Target,
    productivity: BarChart3,
    profile: User,
  };
  
  const IconComponent = icons[name as keyof typeof icons];
  
  return (
    <View style={styles.tabIconContainer}>
      <IconComponent 
        size={size} 
        color={color}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const slidePosition = useSharedValue(0);

  useEffect(() => {
    slidePosition.value = withSpring(state.index, {
      damping: 20,
      stiffness: 200,
    });
  }, [state.index]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      slidePosition.value,
      [0, 1, 2, 3],
      [12, 12 + TAB_WIDTH, 12 + TAB_WIDTH * 2, 12 + TAB_WIDTH * 3]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        <Animated.View style={[styles.slidingBackground, animatedStyle]} />
        
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity 
              key={route.key} 
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <TabBarIcon
                  focused={isFocused}
                  color={isFocused ? '#FFFFFF' : '#A7A7A7'}
                  size={20}
                  name={route.name}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? '#FFFFFF' : '#A7A7A7' }
                  ]}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarLabel: 'Today',
          }}
        />
        <Tabs.Screen
          name="mastery"
          options={{
            title: 'Mastery',
            tabBarLabel: 'Mastery',
          }}
        />
        <Tabs.Screen
          name="productivity"
          options={{
            title: 'Productivity',
            tabBarLabel: 'Productivity',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
          }}
        />
      </Tabs>
      
      <LinearGradient
        colors={['transparent', '#0A0A0A']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 40,
    height: TAB_BAR_HEIGHT,
    width: '100%',
    maxWidth: 340,
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  slidingBackground: {
    position: 'absolute',
    top: 8,
    width: TAB_WIDTH - 8,
    height: TAB_BAR_HEIGHT - 16,
    backgroundColor: '#0A0A0A',
    borderRadius: 32,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: '100%',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 9,
  },
});