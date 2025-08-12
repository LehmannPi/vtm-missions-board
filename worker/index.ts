interface Mission {
  objective: string;
  reward: number;
  active: boolean;
  failed: boolean;
}

interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Ensure DB is available
    if (!env.DB) {
      return new Response('Database not configured', { status: 500 });
    }

    if (path === '/missions' && method === 'POST') {
      // CREATE a new mission
      let body: Partial<Mission>;
      try {
        body = await request.json();
      } catch (e) {
        return new Response('Invalid JSON body', { status: 400 });
      }

      const { objective, reward, active, failed } = body;

      // Validate required fields
      if (
        typeof objective !== 'string' ||
        typeof reward !== 'number' ||
        typeof active !== 'boolean' ||
        typeof failed !== 'boolean'
      ) {
        return new Response('Missing or invalid fields', { status: 400 });
      }

      try {
        const { success } = await env.DB.prepare(
          'INSERT INTO missions (objective, reward, active, failed) VALUES (?, ?, ?, ?)'
        )
          .bind(objective, reward, active, failed)
          .run();

        if (success) {
          return new Response('Mission created successfully', { status: 201 });
        } else {
          return new Response('Failed to create mission', { status: 500 });
        }
      } catch (e) {
        return new Response('Database error: ' + (e as Error).message, {
          status: 500,
        });
      }
    }

    if (path === '/missions' && method === 'GET') {
      // READ all missions
      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM missions'
        ).all();
        return Response.json(results);
      } catch (e) {
        return new Response('Database error: ' + (e as Error).message, {
          status: 500,
        });
      }
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
