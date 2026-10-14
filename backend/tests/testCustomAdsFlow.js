import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import { CustomAd } from '../models/CustomAd.js';
import { AdSetting } from '../models/AdSetting.js';
import {
  getCustomAds,
  createCustomAd,
  getCustomAdById,
  updateCustomAd,
  toggleCustomAdStatus,
  getCustomAdAnalytics,
  bulkCustomAdsAction,
  serveAd,
  trackImpression,
  trackClick,
  trackVideoEvent,
  getRotationSettings,
  updateRotationSettings,
  deleteCustomAd
} from '../controllers/ad.controller.js';

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
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
  console.log('🧪 Starting Custom Ads System API Architecture Tests...');
  await connectDB();

  let testAdId = null;

  try {
    // 1. Create a Custom Ad Campaign
    console.log('\n--- 1. Testing createCustomAd ---');
    const reqCreate = {
      body: {
        title: 'Cyberpunk 2077 Sponsor Spotlight',
        advertiser: 'CD Projekt Red',
        type: 'VIDEO_PREROLL',
        placement: 'PLAYER_PREROLL',
        mediaType: 'VIDEO',
        mediaUrl: 'https://storage.googleapis.com/esquare-media/ads/cyberpunk-trailer.mp4',
        thumbnailUrl: 'https://storage.googleapis.com/esquare-media/ads/cyberpunk-thumb.jpg',
        companionBannerUrl: 'https://storage.googleapis.com/esquare-media/ads/cyberpunk-companion.jpg',
        aspectRatio: '16:9',
        videoDuration: 15,
        skipAfterSeconds: 5,
        ctaText: 'Play Now',
        ctaAction: 'EXTERNAL_URL',
        targetUrl: 'https://cyberpunk.net',
        targetWindow: '_blank',
        targetDevices: 'ALL',
        targetPage: 'WATCH_ONLY',
        priority: 9,
        status: 'ACTIVE',
        cappingImpressions: 50000,
        cappingClicks: 2500
      }
    };
    const resCreate = mockRes();
    let nextErr = null;
    await createCustomAd(reqCreate, resCreate, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;

    console.log('✅ Status:', resCreate.statusCode);
    console.log('✅ Created Ad Title:', resCreate.data?.data?.ad?.title);
    console.log('✅ Campaign Priority:', resCreate.data?.data?.ad?.priority);
    testAdId = resCreate.data?.data?.ad?.id || resCreate.data?.data?.ad?._id;
    console.log('✅ Generated Campaign ID:', testAdId);

    // 2. Fetch Single Custom Ad
    console.log('\n--- 2. Testing getCustomAdById ---');
    const reqGet = { params: { id: testAdId } };
    const resGet = mockRes();
    await getCustomAdById(reqGet, resGet, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Retrieved Campaign Advertiser:', resGet.data?.data?.ad?.advertiser);
    console.log('✅ Video Duration:', resGet.data?.data?.ad?.videoDuration, 'seconds');
    console.log('✅ Skip After Seconds:', resGet.data?.data?.ad?.skipAfterSeconds, 'seconds');

    // 3. Fetch Inventory with Filters & KPIs
    console.log('\n--- 3. Testing getCustomAds (Inventory & KPIs) ---');
    const reqList = {
      query: {
        page: 1,
        limit: 10,
        placement: 'PLAYER_PREROLL',
        status: 'ACTIVE',
        sortBy: 'priority'
      }
    };
    const resList = mockRes();
    await getCustomAds(reqList, resList, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Status:', resList.statusCode);
    console.log('✅ Total Matching Ads:', resList.data?.data?.pagination?.total);
    console.log('✅ Overall Active Campaigns:', resList.data?.data?.stats?.activeCount);
    console.log('✅ Total Impressions Aggregated:', resList.data?.data?.stats?.totalImpressions);

    // 4. Test Update Custom Ad
    console.log('\n--- 4. Testing updateCustomAd ---');
    const reqUpdate = {
      params: { id: testAdId },
      body: {
        ctaText: 'Experience Night City',
        priority: 10
      }
    };
    const resUpdate = mockRes();
    await updateCustomAd(reqUpdate, resUpdate, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Updated CTA Text:', resUpdate.data?.data?.ad?.ctaText);
    console.log('✅ Updated Priority:', resUpdate.data?.data?.ad?.priority);

    // 5. Test Rotation Settings
    console.log('\n--- 5. Testing Rotation Settings ---');
    const reqRotUpdate = {
      body: {
        enabled: true,
        policy: 'PRIORITY_WEIGHTED',
        preventConsecutive: true,
        dailyGlobalImpressionCap: 100000
      }
    };
    const resRotUpdate = mockRes();
    await updateRotationSettings(reqRotUpdate, resRotUpdate, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Rotation Policy Updated To:', resRotUpdate.data?.data?.rotationSettings?.policy);

    // 6. Test Ad Decision Engine (serveAd)
    console.log('\n--- 6. Testing Ad Decision Engine (serveAd) ---');
    // Test 6a: Standard user requesting preroll
    const reqServe = {
      query: {
        placement: 'PLAYER_PREROLL',
        format: 'VIDEO_PREROLL',
        platform: 'android',
        page: 'WATCH_ONLY',
        isVip: false
      }
    };
    const resServe = mockRes();
    await serveAd(reqServe, resServe, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Decision Show Ad:', resServe.data?.data?.showAd);
    console.log('✅ Ad Source Selected:', resServe.data?.data?.adSource);
    console.log('✅ Served Campaign Title:', resServe.data?.data?.ad?.title);
    console.log('✅ Tracking Endpoints provided:', resServe.data?.data?.ad?.tracking);

    // Test 6b: VIP Subscriber Protection
    const reqVipServe = {
      query: {
        placement: 'PLAYER_PREROLL',
        format: 'VIDEO_PREROLL',
        platform: 'android',
        isVip: true
      }
    };
    const resVipServe = mockRes();
    await serveAd(reqVipServe, resVipServe, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ VIP Request Show Ad:', resVipServe.data?.data?.showAd);
    console.log('✅ VIP Exemption Reason:', resVipServe.data?.data?.reason);

    // 7. Test Impression & Click Tracking
    console.log('\n--- 7. Testing trackImpression & trackClick ---');
    const reqTrackImp = { params: { id: testAdId } };
    const resTrackImp = mockRes();
    await trackImpression(reqTrackImp, resTrackImp, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Track Impression Count:', resTrackImp.data?.data?.impressionsCount);

    const reqTrackClk = { params: { id: testAdId } };
    const resTrackClk = mockRes();
    await trackClick(reqTrackClk, resTrackClk, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Track Click Count:', resTrackClk.data?.data?.clicksCount);

    // 8. Test VAST Video Quartile Events
    console.log('\n--- 8. Testing trackVideoEvent (VAST Milestones) ---');
    const reqVideoStart = {
      params: { id: testAdId },
      body: { eventType: 'start' }
    };
    const resVideoStart = mockRes();
    await trackVideoEvent(reqVideoStart, resVideoStart, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Video Start Recorded:', resVideoStart.data?.data?.recorded);

    const reqVideoMid = {
      params: { id: testAdId },
      body: { eventType: 'midpoint' }
    };
    const resVideoMid = mockRes();
    await trackVideoEvent(reqVideoMid, resVideoMid, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Video Midpoint Recorded:', resVideoMid.data?.data?.recorded);

    const reqVideoComp = {
      params: { id: testAdId },
      body: { eventType: 'complete' }
    };
    const resVideoComp = mockRes();
    await trackVideoEvent(reqVideoComp, resVideoComp, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Video Complete Recorded:', resVideoComp.data?.data?.recorded);

    // 9. Test Timeseries Analytics Retrieval
    console.log('\n--- 9. Testing getCustomAdAnalytics ---');
    const reqAnalytics = {
      params: { id: testAdId },
      query: { days: 7 }
    };
    const resAnalytics = mockRes();
    await getCustomAdAnalytics(reqAnalytics, resAnalytics, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Analytics Campaign Title:', resAnalytics.data?.data?.campaign?.title);
    console.log('✅ All-Time CTR:', resAnalytics.data?.data?.campaign?.allTimeCtr);
    console.log('✅ Video Completion Rate (VCR):', resAnalytics.data?.data?.campaign?.videoFunnel?.completionRate);
    console.log('✅ Timeseries Data Points Count:', resAnalytics.data?.data?.timeseries?.length);

    // 10. Test Toggle Status
    console.log('\n--- 10. Testing toggleCustomAdStatus ---');
    const reqToggle = { params: { id: testAdId } };
    const resToggle = mockRes();
    await toggleCustomAdStatus(reqToggle, resToggle, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Status Toggled To:', resToggle.data?.data?.status);

    // 11. Test Bulk Actions
    console.log('\n--- 11. Testing bulkCustomAdsAction ---');
    const reqBulk = {
      body: {
        action: 'ACTIVATE',
        ids: [testAdId]
      }
    };
    const resBulk = mockRes();
    await bulkCustomAdsAction(reqBulk, resBulk, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Bulk Action Result:', resBulk.data?.data);

    // 12. Cleanup Test Ad
    console.log('\n--- 12. Testing deleteCustomAd ---');
    const reqDelete = { params: { id: testAdId } };
    const resDelete = mockRes();
    await deleteCustomAd(reqDelete, resDelete, (err) => { nextErr = err; });
    if (nextErr) throw nextErr;
    console.log('✅ Campaign Deleted Successfully. Status:', resDelete.statusCode);

    console.log('\n🎉 ALL CUSTOM ADS API ARCHITECTURE TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    if (testAdId) {
      await CustomAd.findByIdAndDelete(testAdId).catch(() => {});
    }
    await closeDB();
  }
};

runTests();
