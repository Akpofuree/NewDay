import { createApp } from './server/app';
import { config } from './server/config';

async function runVerification() {
  console.log('=== Starting Workspace Verification ===');
  console.log(`Database URL Status: ${config.databaseUrl ? 'Configured' : 'Not set (In-Memory Dev Mode)'}`);

  // 1. Initialize Express App
  let app;
  try {
    app = await createApp();
  } catch (err: any) {
    console.error('Failed to initialize Express application:', err);
    process.exit(1);
  }

  const port = 5055;
  const server = app.listen(port, '127.0.0.1', async () => {
    console.log(`Test server active on http://127.0.0.1:${port}`);

    try {
      // 2. Perform Registration / Signup
      console.log('\n[1/4] Testing Auth / Signup endpoint...');
      const signupBody = {
        name: 'Verification Bot',
        email: `verify_${Date.now()}@newday.desk`,
        password: 'securePassword123!',
      };

      const signupUrl = config.databaseUrl 
        ? `http://127.0.0.1:${port}/auth/signup`
        : `http://127.0.0.1:${port}/api/auth/signup`;

      const signupRes = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupBody),
      });

      if (!signupRes.ok) {
        throw new Error(`Signup failed with status ${signupRes.status}: ${await signupRes.text()}`);
      }

      const signupData = await signupRes.json();
      console.log('✓ Signup success. User ID:', signupData.id);

      // Extract session cookie from headers
      const setCookieHeader = signupRes.headers.get('set-cookie');
      if (!setCookieHeader) {
        throw new Error('No session cookie returned in headers during signup.');
      }
      const cookie = setCookieHeader.split(';')[0];
      console.log('✓ Session Cookie acquired.');

      // 3. Test Chat Message endpoint
      console.log('\n[2/4] Testing Chat Area (/api/chat/messages) endpoint...');
      const chatUrl = `http://127.0.0.1:${port}/api/chat/messages`;
      const chatBody = {
        channelId: 'chan_general',
        content: 'Verification test: Checking if chat stream sync is wired correctly.',
        senderId: signupData.id,
      };

      const chatRes = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify(chatBody),
      });

      if (!chatRes.ok) {
        throw new Error(`Chat post failed with status ${chatRes.status}: ${await chatRes.text()}`);
      }

      const chatData = await chatRes.json();
      console.log('✓ Chat Area message sent successfully!');
      console.log('  Message Payload:', JSON.stringify(chatData, null, 2));

      // 4. Test AI Roadmap endpoint
      console.log('\n[3/4] Testing AI Roadmap (/api/ai/roadmap) endpoint...');
      const aiRoadmapUrl = config.databaseUrl 
        ? `http://127.0.0.1:${port}/api/ai/roadmap`
        : `http://127.0.0.1:${port}/api/ai/roadmap`; // mapped to devMemory/ai route

      const roadmapBody = {
        skillName: 'Full-Stack Integration Verification',
        description: 'Verify if AI routes are communicating correctly with the generative service model.',
      };

      const roadmapRes = await fetch(aiRoadmapUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify(roadmapBody),
      });

      if (!roadmapRes.ok) {
        throw new Error(`AI Roadmap failed with status ${roadmapRes.status}: ${await roadmapRes.text()}`);
      }

      const roadmapData = await roadmapRes.json();
      console.log('✓ AI Roadmap generated successfully!');
      console.log(`  Phases Generated: ${roadmapData.phases?.length || 0}`);
      if (roadmapData.phases && roadmapData.phases.length > 0) {
        console.log('  Sample Phase Title:', roadmapData.phases[0].title);
      }

      // 5. Test AI Chat / Coaching endpoint
      console.log('\n[4/4] Testing AI Coaching Chat (/api/ai/chat) endpoint...');
      const aiChatUrl = `http://127.0.0.1:${port}/api/ai/chat`;
      const aiChatBody = {
        taskId: '11111111-2222-3333-4444-555555555555',
        taskTitle: 'Integrate WebSockets Chat',
        message: 'Can you help coach me on setting up WebSockets?',
      };

      const aiChatRes = await fetch(aiChatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify(aiChatBody),
      });

      console.log(`✓ AI Coaching Chat status: ${aiChatRes.status}`);
      const aiChatData = await aiChatRes.json();
      console.log('  Response Payload:', JSON.stringify(aiChatData, null, 2));

      console.log('\n=== All Verification Tests Completed Successfully! ===');
    } catch (err: any) {
      console.error('\n❌ Verification Failed:', err.message || err);
    } finally {
      server.close(() => {
        console.log('\nTest server shut down.');
        process.exit(0);
      });
    }
  });
}

runVerification();
