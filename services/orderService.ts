
import { backend } from './backend';
import { Order } from '../types';

export const saveOrder = async (order: Order): Promise<void> => {
    await backend.createOrder(order);
};

export const getOrders = async (): Promise<Order[]> => {
    return await backend.getOrders();
};

export const clearOrders = async (): Promise<void> => {
    await backend.clearOrders();
};
