#!/usr/bin/env node

// Script to update Facebook ad images for Capital Wealth campaigns
// Usage: node scripts/update-ad-images.js [ad_id] [image_path]

const https = require('https');
const fs = require('fs');
const path = require('path');

const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;

if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    console.error('❌ Missing FB_ACCESS_TOKEN or FB_AD_ACCOUNT_ID environment variables');
    process.exit(1);
}

async function getCurrentAds() {
    console.log('📊 Fetching current active ads...\n');
    
    try {
        // Get active campaign
        const campaignsUrl = `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}/campaigns?fields=name,status,id&access_token=${FB_ACCESS_TOKEN}`;
        const campaigns = JSON.parse(await makeRequest(campaignsUrl));
        
        const activeCampaign = campaigns.data.find(c => c.status === 'ACTIVE');
        if (!activeCampaign) {
            console.log('❌ No active campaigns found');
            return;
        }
        
        console.log(`🎯 Active Campaign: "${activeCampaign.name}"`);
        
        // Get ad sets
        const adsetsUrl = `https://graph.facebook.com/v19.0/${activeCampaign.id}/adsets?fields=name,status,id&access_token=${FB_ACCESS_TOKEN}`;
        const adsets = JSON.parse(await makeRequest(adsetsUrl));
        
        // Get all ads from active ad sets
        const allAds = [];
        for (const adset of adsets.data.filter(a => a.status === 'ACTIVE')) {
            const adsUrl = `https://graph.facebook.com/v19.0/${adset.id}/ads?fields=name,status,id,creative&access_token=${FB_ACCESS_TOKEN}`;
            const ads = JSON.parse(await makeRequest(adsUrl));
            
            for (const ad of ads.data.filter(a => a.status === 'ACTIVE')) {
                // Get creative details
                const creativeUrl = `https://graph.facebook.com/v19.0/${ad.creative.id}?fields=name,object_story_spec,image_url&access_token=${FB_ACCESS_TOKEN}`;
                const creative = JSON.parse(await makeRequest(creativeUrl));
                
                allAds.push({
                    ad_id: ad.id,
                    ad_name: ad.name,
                    adset_name: adset.name,
                    creative_id: ad.creative.id,
                    creative_name: creative.name || 'Unnamed Creative',
                    image_url: creative.image_url || 'No image URL found'
                });
            }
        }
        
        console.log('\n📋 Current Active Ads:');
        console.log('─'.repeat(80));
        allAds.forEach((ad, index) => {
            console.log(`${index + 1}. Ad ID: ${ad.ad_id}`);
            console.log(`   Name: "${ad.ad_name}"`);
            console.log(`   Ad Set: "${ad.adset_name}"`);
            console.log(`   Creative ID: ${ad.creative_id}`);
            console.log(`   Image: ${ad.image_url}`);
            console.log('─'.repeat(40));
        });
        
        return allAds;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function uploadImage(imagePath) {
    if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
    }
    
    console.log(`📤 Uploading image: ${imagePath}`);
    
    // Read image file as base64
    const imageData = fs.readFileSync(imagePath);
    const imageBase64 = imageData.toString('base64');
    const mimeType = getMimeType(imagePath);
    
    // Upload to Facebook
    const uploadUrl = `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}/adimages`;
    const formData = {
        filename: `${Buffer.from(imageBase64, 'base64')}`,
        access_token: FB_ACCESS_TOKEN
    };
    
    // This is a simplified version - in production you'd use proper multipart form data
    const response = await makePostRequest(uploadUrl, {
        source: imageBase64,
        name: path.basename(imagePath),
        access_token: FB_ACCESS_TOKEN
    });
    
    const result = JSON.parse(response);
    
    if (result.images) {
        const imageHash = Object.keys(result.images)[0];
        console.log(`✅ Image uploaded successfully! Hash: ${imageHash}`);
        return imageHash;
    } else {
        throw new Error(`Upload failed: ${response}`);
    }
}

async function createNewCreative(adId, imageHash, copyFromCreativeId) {
    console.log(`🎨 Creating new creative with image hash: ${imageHash}`);
    
    // First, get the current creative details to copy settings
    const creativeUrl = `https://graph.facebook.com/v19.0/${copyFromCreativeId}?fields=object_story_spec,call_to_action,name&access_token=${FB_ACCESS_TOKEN}`;
    const currentCreative = JSON.parse(await makeRequest(creativeUrl));
    
    // Create new creative with updated image
    const newCreativeData = {
        name: `${currentCreative.name} - Updated ${new Date().toISOString().split('T')[0]}`,
        object_story_spec: {
            ...currentCreative.object_story_spec,
            link_data: {
                ...currentCreative.object_story_spec.link_data,
                image_hash: imageHash
            }
        },
        access_token: FB_ACCESS_TOKEN
    };
    
    const createUrl = `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}/adcreatives`;
    const response = await makePostRequest(createUrl, newCreativeData);
    const result = JSON.parse(response);
    
    if (result.id) {
        console.log(`✅ New creative created! ID: ${result.id}`);
        return result.id;
    } else {
        throw new Error(`Creative creation failed: ${response}`);
    }
}

async function updateAd(adId, newCreativeId) {
    console.log(`🔄 Updating ad ${adId} with new creative ${newCreativeId}`);
    
    const updateUrl = `https://graph.facebook.com/v19.0/${adId}`;
    const updateData = {
        creative: { creative_id: newCreativeId },
        access_token: FB_ACCESS_TOKEN
    };
    
    const response = await makePostRequest(updateUrl, updateData);
    const result = JSON.parse(response);
    
    if (result.success) {
        console.log(`✅ Ad updated successfully!`);
        return true;
    } else {
        throw new Error(`Ad update failed: ${response}`);
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
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(postData[key]))}`)
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

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', 
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };
    return types[ext] || 'image/jpeg';
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Show current ads
        await getCurrentAds();
        console.log('\n💡 To update an ad image:');
        console.log('   node scripts/update-ad-images.js [ad_id] [image_path]');
        console.log('\n💡 Example:');
        console.log('   node scripts/update-ad-images.js 120239365601840665 ./new-hero-image.jpg');
        return;
    }
    
    if (args.length !== 2) {
        console.error('❌ Usage: node scripts/update-ad-images.js [ad_id] [image_path]');
        process.exit(1);
    }
    
    const [adId, imagePath] = args;
    
    try {
        // Get current ad details
        const ads = await getCurrentAds();
        const targetAd = ads.find(ad => ad.ad_id === adId);
        
        if (!targetAd) {
            console.error(`❌ Ad ID ${adId} not found in active ads`);
            process.exit(1);
        }
        
        console.log(`\n🎯 Updating ad: "${targetAd.ad_name}"`);
        
        // Upload new image
        const imageHash = await uploadImage(imagePath);
        
        // Create new creative with the image
        const newCreativeId = await createNewCreative(adId, imageHash, targetAd.creative_id);
        
        // Update the ad
        await updateAd(adId, newCreativeId);
        
        console.log('\n🎉 Ad image updated successfully!');
        console.log(`📊 Run fb-report.js again to see the updated performance`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();