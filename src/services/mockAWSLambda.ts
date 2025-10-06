/**
 * Mock AWS Lambda Functions
 * Simulates serverless backend for TruPath
 */

import { Journey } from '../types/journey';

// Mock API Gateway Event
export interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  body?: string;
  headers?: Record<string, string>;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}

// Mock Lambda Response
export interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

// Mock DynamoDB table for journeys
const journeyTable: Map<string, Journey> = new Map();

// Mock S3 bucket for journey logs
const journeyLogs: Array<{
  journeyId: string;
  timestamp: number;
  event: string;
  data: any;
}> = [];

/**
 * Lambda: Create Journey
 * POST /journeys
 */
export async function createJourneyHandler(event: APIGatewayEvent): Promise<LambdaResponse> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const journey: Journey = JSON.parse(event.body);

    // Store in DynamoDB (mock)
    journeyTable.set(journey.id, journey);

    // Log to S3 (mock)
    journeyLogs.push({
      journeyId: journey.id,
      timestamp: Date.now(),
      event: 'JOURNEY_CREATED',
      data: journey,
    });

    console.log(`[Lambda:createJourney] Created journey ${journey.id}`);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        journeyId: journey.id,
        message: 'Journey created successfully',
      }),
    };
  } catch (error: any) {
    console.error('[Lambda:createJourney] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Lambda: Get Journey
 * GET /journeys/:id
 */
export async function getJourneyHandler(event: APIGatewayEvent): Promise<LambdaResponse> {
  try {
    const journeyId = event.pathParameters?.id;

    if (!journeyId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing journey ID' }),
      };
    }

    const journey = journeyTable.get(journeyId);

    if (!journey) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Journey not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(journey),
    };
  } catch (error: any) {
    console.error('[Lambda:getJourney] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Lambda: Update Journey Stage
 * PUT /journeys/:id/stage
 */
export async function updateJourneyStageHandler(event: APIGatewayEvent): Promise<LambdaResponse> {
  try {
    const journeyId = event.pathParameters?.id;
    const { stage } = event.body ? JSON.parse(event.body) : {};

    if (!journeyId || !stage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing journey ID or stage' }),
      };
    }

    const journey = journeyTable.get(journeyId);

    if (!journey) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Journey not found' }),
      };
    }

    // Update journey
    journey.currentStage = stage;

    if (stage === 5) {
      journey.status = 'completed';
      journey.completedAt = Date.now();
    }

    journeyTable.set(journeyId, journey);

    // Log event
    journeyLogs.push({
      journeyId,
      timestamp: Date.now(),
      event: `STAGE_${stage}_COMPLETED`,
      data: { stage, status: journey.status },
    });

    console.log(`[Lambda:updateStage] Journey ${journeyId} → Stage ${stage}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        journey,
      }),
    };
  } catch (error: any) {
    console.error('[Lambda:updateStage] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Lambda: List All Journeys
 * GET /journeys
 */
export async function listJourneysHandler(event: APIGatewayEvent): Promise<LambdaResponse> {
  try {
    const status = event.queryStringParameters?.status;

    let journeys = Array.from(journeyTable.values());

    if (status) {
      journeys = journeys.filter((j) => j.status === status);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: journeys.length,
        journeys,
      }),
    };
  } catch (error: any) {
    console.error('[Lambda:listJourneys] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Lambda: Get Journey Logs
 * GET /journeys/:id/logs
 */
export async function getJourneyLogsHandler(event: APIGatewayEvent): Promise<LambdaResponse> {
  try {
    const journeyId = event.pathParameters?.id;

    if (!journeyId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing journey ID' }),
      };
    }

    const logs = journeyLogs
      .filter((log) => log.journeyId === journeyId)
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        journeyId,
        logCount: logs.length,
        logs,
      }),
    };
  } catch (error: any) {
    console.error('[Lambda:getJourneyLogs] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Mock API Gateway Router
 */
export async function mockAPIGateway(event: APIGatewayEvent): Promise<LambdaResponse> {
  const { httpMethod, path } = event;

  console.log(`[API Gateway] ${httpMethod} ${path}`);

  // Route to appropriate Lambda
  if (httpMethod === 'POST' && path === '/journeys') {
    return createJourneyHandler(event);
  }

  if (httpMethod === 'GET' && path.startsWith('/journeys/') && path.endsWith('/logs')) {
    return getJourneyLogsHandler(event);
  }

  if (httpMethod === 'GET' && path.startsWith('/journeys/')) {
    return getJourneyHandler(event);
  }

  if (httpMethod === 'PUT' && path.match(/\/journeys\/.*\/stage/)) {
    return updateJourneyStageHandler(event);
  }

  if (httpMethod === 'GET' && path === '/journeys') {
    return listJourneysHandler(event);
  }

  // 404 Not Found
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Route not found' }),
  };
}

// Export mock data accessors (for testing/debugging)
export const mockAWSState = {
  getJourneys: () => Array.from(journeyTable.values()),
  getJourneyLogs: () => journeyLogs,
  clearAll: () => {
    journeyTable.clear();
    journeyLogs.length = 0;
  },
};
