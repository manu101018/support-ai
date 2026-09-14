import { z } from "zod";

export const GetOrderArgsSchema = z.object({
    orderId: z.number().int().positive(),
});

export const GetPaymentArgsSchema = z.object({
    orderId: z.number().int().positive(),
});

export const GetCustomerArgsSchema = z.object({
    email: z.email(),
});

export const GetOrdersArgsSchema = z.object({
    userId: z.number().int().positive(),
});