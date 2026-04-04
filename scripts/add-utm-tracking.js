#!/usr/bin/env node

// Add UTM tracking parameters to Facebook ads
// Usage: node scripts/add-utm-tracking.js

const https = require('https');

const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const BASE_URL = "https://www.capitalwealth.com/federal-benefits-seminar/";

if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    console.error('❌ Missing FB_ACCESS_TOKEN or FB_AD_ACCOUNT_ID environment variables');
    process.exit(1);
}

// Generate UTM parameters for each ad
function generateUTMUrl(adName, adsetName, campaignName) {
    const params = new URLSearchParams({
        utm_source: 'facebook-ads',
        utm_medium: 'paid-social', 
        utm_campaign: campaignName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        utm_content: adName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        utm_term: adsetName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    });
    
    return `${BASE_URL}?${params.toString()}`;
}

async function getAllActiveAds() {
    console.log('📊 Fetching all active ads for UTM update...\n');
    
    try {
        // Get active campaign
        const campaignsUrl = `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}/campaigns?fields=name,status,id&access_token=${FB_ACCESS_TOKEN}`;
        const campaigns = JSON.parse(await makeRequest(campaignsUrl));
        
        const activeCampaign = campaigns.data.find(c => c.status === 'ACTIVE');
        if (!activeCampaign) {
            console.log('❌ No active campaigns found');
            return [];
        }
        
        console.log(`🎯 Campaign: "${activeCampaign.name}"`);
        
        // Get ad sets
        const adsetsUrl = `https://graph.facebook.com/v19.0/${activeCampaign.id}/adsets?fields=name,status,id&access_token=${FB_ACCESS_TOKEN}`;
        const adsets = JSON.parse(await makeRequest(adsetsUrl));
        
        const allAds = [];
        for (const adset of adsets.data.filter(a => a.status === 'ACTIVE')) {
            const adsUrl = `https://graph.facebook.com/v19.0/${adset.id}/ads?fields=name,status,id,creative&access_token=${FB_ACCESS_TOKEN}`;
            const ads = JSON.parse(await makeRequest(adsUrl));
            
            for (const ad of ads.data.filter(a => a.status === 'ACTIVE')) {
                // Get creative details
                const creativeUrl = `https://graph.facebook.com/v19.0/${ad.creative.id}?fields=object_story_spec,name&access_token=${FB_ACCESS_TOKEN}`;
                const creative = JSON.parse(await makeRequest(creativeUrl));
                
                allAds.push({
                    ad_id: ad.id,
                    ad_name: ad.name,
                    adset_name: adset.name,
                    campaign_name: activeCampaign.name,
                    creative_id: ad.creative.id,
                    current_link: creative.object_story_spec?.link_data?.link || 'No link found',
                    creative_spec: creative.object_story_spec
                });
            }
        }
        
        return allAds;
    } catch (error) {
        console.error('❌ Error fetching ads:', error.message);
        return [];
    }
}

async function updateAdWithUTM(ad) {
    console.log(`🔄 Updating: "${ad.ad_name}"`);
    
    const newUrl = generateUTMUrl(ad.ad_name, ad.adset_name, ad.campaign_name);
    console.log(`   New URL: ${newUrl}`);
    
    try {
        // Create new creative with updated URL
        const newCreativeData = {
            name: `${ad.creative_spec.name || ad.ad_name} - UTM Updated ${new Date().toISOString().split('T')[0]}`,
            object_story_spec: {
                ...ad.creative_spec,
                link_data: {
                    ...ad.creative_spec.link_data,
                    link: newUrl
                }
            },
            access_token: FB_ACCESS_TOKEN
        };
        
        const createUrl = `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}/adcreatives`;
        const creativeResponse = await makePostRequest(createUrl, newCreativeData);
        const creativeResult = JSON.parse(creativeResponse);
        
        if (!creativeResult.id) {
            throw new Error(`Creative creation failed: ${creativeResponse}`);
        }
        
        console.log(`   ✅ New creative created: ${creativeResult.id}`);
        
        // Update the ad to use the new creative
        const updateUrl = `https://graph.facebook.com/v19.0/${ad.ad_id}`;
        const updateData = {
            creative: { creative_id: creativeResult.id },
            access_token: FB_ACCESS_TOKEN
        };
        
        const adResponse = await makePostRequest(updateUrl, updateData);
        const adResult = JSON.parse(adResponse);
        
        if (adResult.success) {
            console.log(`   ✅ Ad updated successfully!`);
            return true;
        } else {
            throw new Error(`Ad update failed: ${adResponse}`);
        }
        
    } catch (error) {
        console.error(`   ❌ Error updating ad: ${error.message}`);
        return false;
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function makePostRequest(url, postData) {
    return new Promise((resolve, reject) => {
        const data = Object.keys(postData)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(
                typeof postData[key] === 'object' ? JSON.stringify(postData[key]) : postData[key]
            )}`)
            .join('&');
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };
        
        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => resolve(responseData));
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('🚀 Starting UTM tracking update for Facebook ads...\n');
    
    const ads = await getAllActiveAds();
    
    if (ads.length === 0) {
        console.log('❌ No active ads found to update');
        return;
    }
    
    console.log(`\n📊 Found ${ads.length} active ads to update with UTM tracking\n`);
    
    let successCount = 0;
    for (const ad of ads) {
        const success = await updateAdWithUTM(ad);
        if (success) successCount++;
        console.log(''); // Add spacing
    }
    
    console.log('═'.repeat(60));
    console.log(`🎉 UTM Update Complete!`);
    console.log(`✅ Successfully updated: ${successCount}/${ads.length} ads`);
    console.log(`📊 All Facebook traffic will now be tagged as "facebook-ads"`);
    console.log(`🔍 New leads will show source: "facebook-ads" instead of "facebook"`);
    console.log('═'.repeat(60));
}

main();