import app from '../app.js';
import fs from 'fs';
import path from 'path';

async function runUploadTests() {
  console.log('🧪 Starting E² Stories Upload APIs Test Suite...\n');

  // Start test server on dynamic port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Test server running on ${baseUrl}\n`);

  let createdFiles = [];

  try {
    // -------------------------------------------------------------
    // Test 1: Single file upload (Image)
    // -------------------------------------------------------------
    console.log('--- Test 1: Single File Upload (POST /api/v1/upload/single) ---');
    const form1 = new FormData();
    const fakeImageContent = 'fake-png-image-binary-data';
    const imageBlob = new Blob([fakeImageContent], { type: 'image/png' });
    form1.append('file', imageBlob, 'test_poster.png');

    const res1 = await fetch(`${baseUrl}/api/v1/upload/single`, {
      method: 'POST',
      body: form1
    });

    const body1 = await res1.json();
    console.log('Status:', res1.status);
    console.log('Response:', JSON.stringify(body1, null, 2));

    if (res1.status !== 201 || !body1.success) {
      throw new Error(`Test 1 Failed: Expected status 201, got ${res1.status}`);
    }
    if (body1.data.folder !== 'images') {
      throw new Error(`Test 1 Failed: Expected folder 'images', got '${body1.data.folder}'`);
    }
    createdFiles.push(path.join(process.cwd(), body1.data.path));
    console.log('✅ Test 1 Passed: Single file upload successful with correct metadata and folder routing.\n');

    // -------------------------------------------------------------
    // Test 2: Multiple files upload (Image + Subtitle/Document)
    // -------------------------------------------------------------
    console.log('--- Test 2: Multiple Files Upload (POST /api/v1/upload/multiple) ---');
    const form2 = new FormData();
    const file1Blob = new Blob(['sample-banner-image'], { type: 'image/jpeg' });
    const file2Blob = new Blob(['WEBVTT\n00:00:01.000 --> 00:00:04.000\nHello world'], { type: 'text/vtt' });

    form2.append('files', file1Blob, 'banner.jpg');
    form2.append('files', file2Blob, 'episode1.vtt');

    const res2 = await fetch(`${baseUrl}/api/v1/upload/multiple`, {
      method: 'POST',
      body: form2
    });

    const body2 = await res2.json();
    console.log('Status:', res2.status);
    console.log('Response:', JSON.stringify(body2, null, 2));

    if (res2.status !== 201 || !body2.success) {
      throw new Error(`Test 2 Failed: Expected status 201, got ${res2.status}`);
    }
    if (body2.data.count !== 2 || body2.data.files.length !== 2) {
      throw new Error(`Test 2 Failed: Expected 2 files, got ${body2.data.count}`);
    }
    for (const f of body2.data.files) {
      createdFiles.push(path.join(process.cwd(), f.path));
    }
    console.log('✅ Test 2 Passed: Multiple files upload successful with 2 items categorized.\n');

    // -------------------------------------------------------------
    // Test 3: Single file upload without file (Validation Error)
    // -------------------------------------------------------------
    console.log('--- Test 3: Validation Error on missing file ---');
    const emptyForm = new FormData();
    const res3 = await fetch(`${baseUrl}/api/v1/upload/single`, {
      method: 'POST',
      body: emptyForm
    });

    const body3 = await res3.json();
    console.log('Status:', res3.status);
    console.log('Response:', JSON.stringify(body3, null, 2));

    if (res3.status !== 400 || body3.success !== false) {
      throw new Error(`Test 3 Failed: Expected status 400, got ${res3.status}`);
    }
    console.log('✅ Test 3 Passed: Missing file correctly rejected with 400 Bad Request.\n');

    // -------------------------------------------------------------
    // Test 4: Static File Serving (GET /uploads/images/...)
    // -------------------------------------------------------------
    console.log('--- Test 4: Static File Serving Check ---');
    const staticUrl = body1.data.url;
    console.log(`Fetching uploaded file from URL: ${staticUrl}`);
    const res4 = await fetch(staticUrl);
    const text4 = await res4.text();
    console.log('Static fetch status:', res4.status);

    if (res4.status !== 200 || text4 !== fakeImageContent) {
      throw new Error(`Test 4 Failed: Expected 200 with matching content, got status ${res4.status}`);
    }
    console.log('✅ Test 4 Passed: Uploaded file publicly accessible via HTTP GET URL.\n');

    console.log('🎉 ALL UPLOAD TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    // Clean up created test files
    for (const filePath of createdFiles) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        // ignore cleanup error
      }
    }

    server.close();
  }
}

runUploadTests().catch((err) => {
  console.error('❌ Upload Test Failed:', err);
  process.exit(1);
});
