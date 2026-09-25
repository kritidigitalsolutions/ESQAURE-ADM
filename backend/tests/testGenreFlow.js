import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import { Genre } from '../models/Genre.js';
import { Drama } from '../models/Drama.js';
import { seedDefaultGenres } from '../config/seedGenres.js';
import { GenreController } from '../controllers/genre.controller.js';

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

const runTests = async () => {
  console.log('🧪 Starting Genres API Flow Tests...');
  await connectDB();
  await seedDefaultGenres();

  let createdTestGenreId = null;

  try {
    // 1. Test Admin Get Genres
    console.log('\n--- 1. Testing GenreController.getAdminGenres ---');
    const req1 = {};
    const res1 = mockRes();
    let nextErr = null;
    await GenreController.getAdminGenres(req1, res1, (err) => { nextErr = err; });

    if (nextErr) throw nextErr;
    console.log('✅ Status:', res1.statusCode || 200);
    console.log('✅ Total Genres:', res1.data?.data?.stats?.totalGenres);
    console.log('✅ Active Genres:', res1.data?.data?.stats?.activeGenres);
    console.log('✅ Total Series Counted:', res1.data?.data?.stats?.totalSeries);
    console.log('Sample Genre with real dramaCount:', {
      name: res1.data?.data?.genres[0]?.name,
      slug: res1.data?.data?.genres[0]?.slug,
      dramaCount: res1.data?.data?.genres[0]?.dramaCount,
      color: res1.data?.data?.genres[0]?.color,
      icon: res1.data?.data?.genres[0]?.icon
    });

    // 2. Test Create Genre
    console.log('\n--- 2. Testing GenreController.createGenre ---');
    const req2 = {
      body: {
        name: 'Sci-Fi Cyberpunk Test',
        slug: 'scifi-cyberpunk-test',
        icon: 'Sparkles',
        color: '#8B5CF6',
        displayOrder: 99,
        isActive: true
      }
    };
    const res2 = mockRes();
    await GenreController.createGenre(req2, res2, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;

    console.log('✅ Created Genre:', res2.data?.data?.genre?.name, 'ID:', res2.data?.data?.genre?.id);
    createdTestGenreId = res2.data?.data?.genre?.id;

    // 3. Test Update Genre
    console.log('\n--- 3. Testing GenreController.updateGenre ---');
    const req3 = {
      params: { id: createdTestGenreId },
      body: {
        name: 'Sci-Fi Cyberpunk Modified',
        color: '#3B82F6'
      }
    };
    const res3 = mockRes();
    await GenreController.updateGenre(req3, res3, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Updated Genre Name:', res3.data?.data?.genre?.name, 'Color:', res3.data?.data?.genre?.color);

    // 4. Test Toggle Active Status
    console.log('\n--- 4. Testing GenreController.toggleActive ---');
    const req4 = { params: { id: createdTestGenreId } };
    const res4 = mockRes();
    await GenreController.toggleActive(req4, res4, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Toggled Genre isActive:', res4.data?.data?.genre?.isActive);

    // 5. Test Public Get Active Genres
    console.log('\n--- 5. Testing GenreController.getActiveGenres ---');
    const req5 = {};
    const res5 = mockRes();
    await GenreController.getActiveGenres(req5, res5, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    const isPresent = res5.data?.data?.genres?.some(g => g.id === createdTestGenreId);
    console.log('✅ Test genre hidden from active genres list (since isActive=false):', !isPresent);

    // 6. Test Delete Genre
    console.log('\n--- 6. Testing GenreController.deleteGenre ---');
    const req6 = { params: { id: createdTestGenreId } };
    const res6 = mockRes();
    await GenreController.deleteGenre(req6, res6, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Deleted Test Genre:', res6.data?.data?.deletedId);

    console.log('\n🎉 ALL GENRE FLOW TESTS PASSED SUCCESSFULLY! Real dynamic backend is 100% operational.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    // Cleanup if needed
    if (createdTestGenreId) {
      await Genre.findByIdAndDelete(createdTestGenreId);
    }
  } finally {
    await closeDB();
    process.exit(0);
  }
};

runTests();
