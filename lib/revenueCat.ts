import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';

export interface SubscriptionPlan {
  id: string;
  title: string;
  duration: string;
  price: string;
  monthlyPrice: string;
  discount?: string;
  savings?: string;
  package: PurchasesPackage;
}

export class RevenueCatService {
  static async getOfferings(): Promise<SubscriptionPlan[]> {
    try {
      console.log('📡 RevenueCat: Calling Purchases.getOfferings()...');
      
      const offerings = await Purchases.getOfferings();
      console.log('📦 RevenueCat: Raw offerings response:', offerings);
      console.log('📦 RevenueCat: Current offering:', offerings.current);
      
      const currentOffering = offerings.current;
      
      if (!currentOffering) {
        console.error('❌ RevenueCat: No current offering found');
        throw new Error('No current offering available from RevenueCat');
      }

      console.log('📋 RevenueCat: Available packages:', currentOffering.availablePackages);
      
      return currentOffering.availablePackages.map(pkg => {
        const product = pkg.product;
        const price = product.priceString;
        
        // Determine plan type based on product identifier or title
        const isAnnual = product.title.toLowerCase().includes('annual') || 
                        product.title.toLowerCase().includes('yearly') ||
                        product.identifier.toLowerCase().includes('annual') ||
                        product.identifier.toLowerCase().includes('yearly');
        
        const title = isAnnual ? 'Annual' : 'Monthly';
        const duration = isAnnual ? '12 mo' : '1 mo';
        
        // Calculate monthly price for comparison
        const monthlyPrice = isAnnual 
          ? `$${(product.price / 12).toFixed(2)}/mo`
          : price + '/mo';

        // Calculate discount for annual (assuming monthly is $9.99)
        const monthlyPriceValue = 9.99;
        const annualPriceValue = product.price;
        const annualMonthlyEquivalent = annualPriceValue / 12;
        const discountPercentage = Math.round(((monthlyPriceValue - annualMonthlyEquivalent) / monthlyPriceValue) * 100);
        
        const discount = isAnnual ? `${discountPercentage}% OFF` : undefined;
        const savings = isAnnual ? `${12 - Math.round(annualPriceValue / monthlyPriceValue)} months free` : undefined;

        return {
          id: pkg.identifier,
          title,
          duration,
          price,
          monthlyPrice,
          discount,
          savings,
          package: pkg,
        };
      });
    } catch (error) {
      console.error('❌ RevenueCat: getOfferings failed:', error);
      throw error;
    }
  }

  static async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    } catch (error) {
      console.error('Error purchasing package:', error);
      throw error;
    }
  }

  static async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  static async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Error getting customer info:', error);
      throw error;
    }
  }

  static async cancelSubscription(): Promise<void> {
    try {
      // For Android, we can open the Google Play subscription management
      // Note: This is a simplified approach - in production you might want to
      // show instructions or open a deep link to Google Play
      console.log('Direct users to Google Play > Account > Subscriptions');
      
      // You could also show an alert with instructions
      // Alert.alert(
      //   'Cancel Subscription',
      //   'To cancel your subscription, please go to:\n\nGoogle Play Store > Account > Subscriptions'
      // );
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
      throw error;
    }
  }

  static async identifyUser(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Error identifying user:', error);
      throw error;
    }
  }

  static async getSubscriptionStatus(): Promise<{
    isPro: boolean;
    nextBillingDate?: string;
    planType?: string;
  }> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const proEntitlement = customerInfo.entitlements.active['pro'];
      
      return {
        isPro: proEntitlement !== undefined,
        nextBillingDate: proEntitlement?.expirationDate 
          ? new Date(proEntitlement.expirationDate).toLocaleDateString()
          : undefined,
        planType: proEntitlement?.productIdentifier,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        isPro: false,
      };
    }
  }
} 