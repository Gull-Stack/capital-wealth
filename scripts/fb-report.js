#!/usr/bin/env node

// Command line tool for fetching Capital Wealth Facebook campaign reports
// Usage: node scripts/fb-report.js [date_preset] [format]

const https = require('https');
const fs = require('fs');

// Configuration from environment variables
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;

if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   FB_ACCESS_TOKEN - Your Facebook access token');
    console.error('   FB_AD_ACCOUNT_ID - Your ad account ID (without act_ prefix)');
    console.error('\nExample:');
    console.error('   export FB_ACCESS_TOKEN="your_token_here"');
    console.error('   export FB_AD_ACCOUNT_ID="123456789"');
    process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const datePreset = args[0] || 'last_7d';
const outputFormat = args[1] || 'json';

const validPresets = [
    'today', 'yesterday', 'this_month', 'last_month',
    'this_quarter', 'last_quarter', 'this_year', 'last_year',
    'last_3d', 'last_7d', 'last_14d', 'last_28d', 
    'last_30d', 'last_90d'
];

if (!validPresets.includes(datePreset)) {
    console.error(`❌ Invalid date preset: ${datePreset}`);
    console.error('Valid options:', validPresets.join(', '));
    process.exit(1);
}

async function fetchFacebookAds() {
    try {
        console.log(`📊 Fetching Capital Wealth Facebook campaigns (${datePreset})...`);

        const baseUrl = `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}`;
        
        // Campaign-level insights
        const campaignFields = [
            'campaign_id', 'campaign_name', 'impressions', 'clicks',
            'spend', 'cpm', 'cpc', 'ctr', 'actions'
        ].join(',');

        const campaignUrl = `${baseUrl}/insights?fields=${campaignFields}&level=campaign&date_preset=${datePreset}&access_token=${FB_ACCESS_TOKEN}`;

        const response = await makeRequest(campaignUrl);
        const data = JSON.parse(response);

        if (data.error) {
            throw new Error(`Facebook API Error: ${data.error.message}`);
        }

        const campaigns = data.data || [];
        const summary = calculateSummary(campaigns);

        const report = {
            account_id: `act_${FB_AD_ACCOUNT_ID}`,
            date_preset: datePreset,
            generated_at: new Date().toISOString(),
            summary,
            campaigns,
            campaign_count: campaigns.length
        };

        // Output based on format
        if (outputFormat === 'csv') {
            outputCSV(report);
        } else if (outputFormat === 'table') {
            outputTable(report);
        } else {
            console.log(JSON.stringify(report, null, 2));
        }

        console.log(`\n✅ Report generated successfully!`);
        console.log(`📈 Total Campaigns: ${campaigns.length}`);
        console.log(`💰 Total Spend: $${summary.total_spend}`);
        console.log(`👆 Total Clicks: ${summary.total_clicks}`);
        console.log(`📊 Average CPC: $${summary.avg_cpc}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
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

function calculateSummary(campaigns) {
    if (!campaigns || campaigns.length === 0) {
        return {
            total_spend: '0.00',
            total_impressions: 0,
            total_clicks: 0,
            avg_cpc: '0.00',
            avg_cpm: '0.00', 
            avg_ctr: '0.00',
            total_conversions: 0
        };
    }

    const totals = campaigns.reduce((acc, campaign) => {
        acc.spend += parseFloat(campaign.spend || 0);
        acc.impressions += parseInt(campaign.impressions || 0);
        acc.clicks += parseInt(campaign.clicks || 0);
        acc.conversions += parseInt(campaign.conversions || 0);
        return acc;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

    return {
        total_spend: totals.spend.toFixed(2),
        total_impressions: totals.impressions,
        total_clicks: totals.clicks,
        avg_cpc: totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : '0.00',
        avg_cpm: totals.impressions > 0 ? ((totals.spend / totals.impressions) * 1000).toFixed(2) : '0.00',
        avg_ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00',
        total_conversions: totals.conversions
    };
}

function outputCSV(report) {
    const headers = ['Campaign Name', 'Spend', 'Impressions', 'Clicks', 'CTR %', 'CPC', 'Conversions'];
    const rows = report.campaigns.map(campaign => [
        `"${campaign.campaign_name || 'Unnamed'}"`,
        campaign.spend || '0',
        campaign.impressions || '0',
        campaign.clicks || '0', 
        campaign.ctr || '0',
        campaign.cpc || '0',
        campaign.conversions || '0'
    ]);

    console.log(headers.join(','));
    rows.forEach(row => console.log(row.join(',')));
}

function outputTable(report) {
    console.log('\n📊 CAPITAL WEALTH FACEBOOK CAMPAIGN REPORT');
    console.log('═'.repeat(80));
    console.log(`Date Range: ${report.date_preset}`);
    console.log(`Generated: ${new Date(report.generated_at).toLocaleString()}`);
    console.log('─'.repeat(80));
    
    if (report.campaigns.length === 0) {
        console.log('No campaigns found for this date range.');
        return;
    }

    // Table headers
    console.log('Campaign Name'.padEnd(25) + 
                'Spend'.padStart(10) + 
                'Impressions'.padStart(12) + 
                'Clicks'.padStart(8) + 
                'CTR%'.padStart(8) + 
                'CPC'.padStart(8) + 
                'Conv.'.padStart(8));
    console.log('─'.repeat(80));

    // Campaign rows
    report.campaigns.forEach(campaign => {
        const name = (campaign.campaign_name || 'Unnamed').substring(0, 24);
        const spend = '$' + parseFloat(campaign.spend || 0).toFixed(2);
        const impressions = parseInt(campaign.impressions || 0).toLocaleString();
        const clicks = (campaign.clicks || 0).toString();
        const ctr = parseFloat(campaign.ctr || 0).toFixed(1) + '%';
        const cpc = '$' + parseFloat(campaign.cpc || 0).toFixed(2);
        const conversions = (campaign.conversions || 0).toString();

        console.log(name.padEnd(25) + 
                   spend.padStart(10) + 
                   impressions.padStart(12) + 
                   clicks.padStart(8) + 
                   ctr.padStart(8) + 
                   cpc.padStart(8) + 
                   conversions.padStart(8));
    });

    console.log('─'.repeat(80));
    console.log(`TOTALS:`.padEnd(25) + 
               `$${report.summary.total_spend}`.padStart(10) + 
               report.summary.total_impressions.toLocaleString().padStart(12) + 
               report.summary.total_clicks.toString().padStart(8) + 
               `${report.summary.avg_ctr}%`.padStart(8) + 
               `$${report.summary.avg_cpc}`.padStart(8) + 
               report.summary.total_conversions.toString().padStart(8));
}

// Run the script
fetchFacebookAds();