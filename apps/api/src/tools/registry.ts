import { FunctionDeclaration } from "@google/genai";
import { getOrderToolDeclaration, executeGetOrderTool } from "./getOrderTool";
import { getPaymentToolDeclaration, executeGetPaymentTool } from './getPaymentTool';
import { getCustomerToolDeclaration, executeGetCustomerTool } from './getCustomerTool';
import { getOrdersToolDeclaration, executeGetOrdersTool } from './getOrdersTool';
import { searchKnowledgeToolDeclaration, executeSearchKnowledgeTool } from './searchKnowledgeTool';

export interface ToolDefinition {
    declaration: FunctionDeclaration;
    execute: (args: any) => Promise<any>;
}

export const toolRegistry: Record<string, ToolDefinition> = {
    getOrderById: { declaration: getOrderToolDeclaration, execute: executeGetOrderTool },
    getPaymentByOrderId: { declaration: getPaymentToolDeclaration, execute: executeGetPaymentTool },
    getCustomerByEmail: { declaration: getCustomerToolDeclaration, execute: executeGetCustomerTool },
    getOrdersByUserId: { declaration: getOrdersToolDeclaration, execute: executeGetOrdersTool },
    searchKnowledgeBase: { declaration: searchKnowledgeToolDeclaration, execute: executeSearchKnowledgeTool },
}

export const allToolDeclarations = Object.values(toolRegistry).map(tool => tool.declaration);