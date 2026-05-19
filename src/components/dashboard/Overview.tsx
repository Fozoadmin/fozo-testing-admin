import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';
import { StatCard } from './StatCard';
import { ShoppingBag, IndianRupee, UtensilsCrossed, Users, Truck } from 'lucide-react';
import { ORDER_STATUS } from '@/constants/orderStatus';
import type { AdminOrder, GroceryOrder } from '@/types';

type OverviewProps = {
  onNavigate?: (key: string) => void;
};

export function Overview({ onNavigate }: OverviewProps) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalRestaurants: 0,
    totalCustomers: 0,
    totalBags: 0,
    totalDeliveryPartners: 0,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const [orders, groceryOrders, restaurants, users, bags, deliveryPartners] = await Promise.all([
          adminApi.getAllOrders(ORDER_STATUS.DELIVERED),
          adminApi.getAllGroceryOrders(ORDER_STATUS.DELIVERED),
          adminApi.getAllRestaurants(),
          adminApi.getAllUsers('customer'),
          adminApi.getAllSurpriseBags(),
          adminApi.getAllDeliveryPartners(),
        ]);

        if (!isMounted) return;

        const restaurantRevenue = orders.orders.reduce((sum: number, order: AdminOrder) => {
          const amount = Number(order.totalPaymentAmount ?? order.total_amount ?? 0);
          return sum + (Number.isNaN(amount) ? 0 : amount);
        }, 0);

        const groceryRevenue = groceryOrders.orders.reduce((sum: number, order: GroceryOrder) => {
          const amount = Number(order.totalPaymentAmount ?? 0);
          return sum + (Number.isNaN(amount) ? 0 : amount);
        }, 0);

        if (import.meta.env.DEV) {
          console.info(
            '[Overview] delivered order response',
            JSON.stringify({
              restaurantOrders: orders.orders.length,
              groceryOrders: groceryOrders.orders.length,
              restaurantRevenue,
              groceryRevenue,
            })
          );
        }

        setStats({
          totalOrders: orders.orders.length + groceryOrders.orders.length,
          totalRevenue: restaurantRevenue + groceryRevenue,
          totalRestaurants: restaurants.length,
          totalCustomers: users.length,
          totalBags: bags.length,
          totalDeliveryPartners: deliveryPartners.length ?? 0,
          loading: false,
        });
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching overview stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='mb-6 grid w-full grid-cols-1 gap-4 lg:grid-cols-5'>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <StatCard
            icon={ShoppingBag}
            title='Total Orders'
            value={stats.loading ? '...' : stats.totalOrders.toLocaleString()}
            onClick={() => onNavigate?.('orders')}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            icon={IndianRupee}
            title='Total Revenue'
            value={stats.loading ? '...' : `₹${stats.totalRevenue.toFixed(2)}`}
            onClick={() => onNavigate?.('orders')}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StatCard
            icon={UtensilsCrossed}
            title='Restaurants'
            value={stats.loading ? '...' : stats.totalRestaurants}
            onClick={() => onNavigate?.('restaurants')}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            icon={Users}
            title='Total Customers'
            value={stats.loading ? '...' : stats.totalCustomers}
            onClick={() => onNavigate?.('customers')}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <StatCard
            icon={Truck}
            title='Delivery Partners'
            value={stats.loading ? '...' : stats.totalDeliveryPartners}
            onClick={() => onNavigate?.('riders')}
          />
        </motion.div>
      </div>
    </div>
  );
}
