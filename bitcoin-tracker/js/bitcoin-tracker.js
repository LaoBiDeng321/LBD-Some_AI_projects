const MAX_BTC_SUPPLY = 21000000;
const BLOCKS_PER_HALVING = 210000;
const SECONDS_PER_BLOCK = 600;
const INITIAL_BLOCK_REWARD = 50;

const halvingEvents = [
    { year: 2009, reward: 50 },
    { year: 2012, reward: 25 },
    { year: 2016, reward: 12.5 },
    { year: 2020, reward: 6.25 },
    { year: 2024, reward: 3.125 },
    { year: 2028, reward: 1.5625 },
    { year: 2032, reward: 0.78125 },
    { year: 2036, reward: 0.390625 },
    { year: 2040, reward: 0.1953125 },
    { year: 2044, reward: 0.09765625 },
    { year: 2048, reward: 0.048828125 },
    { year: 2052, reward: 0.0244140625 },
    { year: 2056, reward: 0.01220703125 },
    { year: 2060, reward: 0.006103515625 },
    { year: 2064, reward: 0.0030517578125 },
    { year: 2068, reward: 0.00152587890625 },
    { year: 2072, reward: 0.000762939453125 },
    { year: 2076, reward: 0.0003814697265625 },
    { year: 2080, reward: 0.00019073486328125 },
    { year: 2084, reward: 0.000095367431640625 },
    { year: 2088, reward: 0.0000476837158203125 },
    { year: 2092, reward: 0.00002384185791015625 },
    { year: 2096, reward: 0.000011920928955078125 },
    { year: 2100, reward: 0.0000059604644775390625 },
    { year: 2104, reward: 0.00000298023223876953125 },
    { year: 2108, reward: 0.000001490116119384765625 },
    { year: 2112, reward: 0.0000007450580596923828125 },
    { year: 2116, reward: 0.00000037252902984619140625 },
    { year: 2120, reward: 0.000000186264514923095703125 },
    { year: 2124, reward: 0.0000000931322574615478515625 },
    { year: 2128, reward: 0.00000004656612873077392578125 },
    { year: 2132, reward: 0.000000023283064365386962890625 },
    { year: 2136, reward: 0.0000000116415321826934814453125 },
    { year: 2140, reward: 0 }
];

function calculateCurrentBlockHeight() {
    const genesisDate = new Date('2009-01-03T00:00:00Z');
    const currentDate = new Date();
    const secondsPassed = (currentDate - genesisDate) / 1000;
    const blockHeight = Math.floor(secondsPassed / SECONDS_PER_BLOCK);
    return blockHeight;
}

function calculateMinedBTC(blockHeight) {
    let minedBTC = 0;
    let currentBlockHeight = 0;
    
    for (let i = 0; i < halvingEvents.length - 1; i++) {
        const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
        const blocksInPeriod = Math.min(halvingBlock, blockHeight) - currentBlockHeight;
        
        if (blocksInPeriod > 0) {
            minedBTC += blocksInPeriod * halvingEvents[i].reward;
            currentBlockHeight += blocksInPeriod;
        }
        
        if (currentBlockHeight >= blockHeight) {
            break;
        }
    }
    
    return minedBTC;
}

function calculateMiningData() {
    const currentBlockHeight = calculateCurrentBlockHeight();
    const minedBTC = calculateMinedBTC(currentBlockHeight);
    const remainingBTC = MAX_BTC_SUPPLY - minedBTC;
    const progressPercent = (minedBTC / MAX_BTC_SUPPLY) * 100;
    
    const currentHalvingIndex = Math.floor(currentBlockHeight / BLOCKS_PER_HALVING);
    const currentReward = halvingEvents[currentHalvingIndex] ? halvingEvents[currentHalvingIndex].reward : 0;
    
    const zeroRewardHalvingIndex = halvingEvents.findIndex(event => event.reward === 0);
    const zeroRewardBlockHeight = zeroRewardHalvingIndex >= 0 ? zeroRewardHalvingIndex * BLOCKS_PER_HALVING : null;
    
    let estimatedCompletionYear = '未知';
    if (zeroRewardBlockHeight) {
        const genesisDate = new Date('2009-01-03T00:00:00Z');
        const blocksRemaining = zeroRewardBlockHeight - currentBlockHeight;
        const secondsRemaining = blocksRemaining * SECONDS_PER_BLOCK;
        const completionDate = new Date(genesisDate.getTime() + zeroRewardBlockHeight * SECONDS_PER_BLOCK * 1000);
        estimatedCompletionYear = completionDate.getFullYear();
    }
    
    return {
        minedBTC: minedBTC,
        remainingBTC: remainingBTC,
        progressPercent: progressPercent,
        currentReward: currentReward,
        estimatedCompletionYear: estimatedCompletionYear,
        totalAngle: 2 * Math.PI * (progressPercent / 100) // 添加totalAngle属性
    };
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    } else {
        return num.toFixed(2);
    }
}

function updateStats() {
    const data = calculateMiningData();
    
    const minedBTCElement = document.getElementById('mined-btc');
    const remainingBTCElement = document.getElementById('remaining-btc');
    const completionDateElement = document.getElementById('completion-date');
    const miningRateElement = document.getElementById('mining-rate');
    const progressPercentElement = document.getElementById('progress-percent');
    
    if (minedBTCElement) {
        minedBTCElement.textContent = formatNumber(data.minedBTC);
    }
    
    if (remainingBTCElement) {
        remainingBTCElement.textContent = formatNumber(data.remainingBTC);
    }
    
    if (completionDateElement) {
        completionDateElement.textContent = data.estimatedCompletionYear;
    }
    
    if (miningRateElement) {
        miningRateElement.textContent = data.currentReward.toFixed(8);
    }
    
    if (progressPercentElement) {
        progressPercentElement.textContent = data.progressPercent.toFixed(2);
    }
    
    return data;
}

function drawChart(data) {
    const canvas = document.getElementById('bitcoin-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    // 获取容器宽度，计算合适的高度
    const containerWidth = container.offsetWidth;
    let canvasHeight = 380; // 默认高度
    
    // 根据屏幕宽度调整高度
    if (window.innerWidth <= 480) {
        canvasHeight = 340;
    } else if (window.innerWidth <= 768) {
        canvasHeight = 380;
    } else {
        canvasHeight = containerWidth * 0.8; // 大屏幕上使用宽度的80%作为高度
    }
    
    // 设置canvas尺寸
    canvas.width = containerWidth * 2;
    canvas.height = canvasHeight * 2;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    ctx.scale(2, 2);
    
    const centerX = containerWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const innerRadius = radius * 0.6;
    
    const currentBlockHeight = calculateCurrentBlockHeight();
    const currentHalvingIndex = Math.floor(currentBlockHeight / BLOCKS_PER_HALVING);
    
    const colors = [
        { start: '#f97316', end: '#fb923c' },
        { start: '#fb923c', end: '#fbbf24' },
        { start: '#fbbf24', end: '#facc15' },
        { start: '#facc15', end: '#a3e635' },
        { start: '#a3e635', end: '#22c55e' },
        { start: '#22c55e', end: '#10b981' },
        { start: '#10b981', end: '#14b8a6' },
        { start: '#14b8a6', end: '#06b6d4' },
        { start: '#06b6d4', end: '#0ea5e9' },
        { start: '#0ea5e9', end: '#3b82f6' },
        { start: '#3b82f6', end: '#6366f1' },
        { start: '#6366f1', end: '#8b5cf6' },
        { start: '#8b5cf6', end: '#a855f7' },
        { start: '#a855f7', end: '#d946ef' },
        { start: '#d946ef', end: '#ec4899' },
        { start: '#ec4899', end: '#f43f5e' },
        { start: '#f43f5e', end: '#ef4444' },
        { start: '#ef4444', end: '#dc2626' },
        { start: '#dc2626', end: '#b91c1c' },
        { start: '#b91c1c', end: '#991b1b' },
        { start: '#991b1b', end: '#7f1d1d' },
        { start: '#7f1d1d', end: '#64748b' },
        { start: '#64748b', end: '#475569' },
        { start: '#475569', end: '#334155' },
        { start: '#334155', end: '#1e293b' },
        { start: '#1e293b', end: '#0f172a' }
    ];
    
    let currentAngle = -Math.PI / 2;
    const totalAngle = 2 * Math.PI;
    const minedBTC = calculateMinedBTC(currentBlockHeight);
    const progressPercent = (minedBTC / MAX_BTC_SUPPLY) * 100;
    const minedAngle = totalAngle * (progressPercent / 100);
    
    let totalMinedInDisplayedPeriods = 0;
    for (let i = 0; i < halvingEvents.length; i++) {
        const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
        const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
        
        if (blocksInPeriod <= 0) {
            break;
        }
        
        const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
        totalMinedInDisplayedPeriods += minedInPeriod;
    }
    
    for (let i = 0; i < halvingEvents.length; i++) {
        const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
        const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
        
        if (blocksInPeriod <= 0) {
            break;
        }
        
        const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
        const periodRatio = totalMinedInDisplayedPeriods > 0 ? minedInPeriod / totalMinedInDisplayedPeriods : 0;
        const segmentAngle = minedAngle * periodRatio;
        
        const colorIndex = Math.min(i, colors.length - 1);
        const gradient = ctx.createLinearGradient(0, 0, container.offsetWidth, container.offsetHeight);
        gradient.addColorStop(0, colors[colorIndex].start);
        gradient.addColorStop(1, colors[colorIndex].end);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + segmentAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        if (i % 1 === 0) { // 每个周期都显示标注
            const midAngle = currentAngle + segmentAngle / 2;
            const labelRadius = radius + 20;
            const labelX = centerX + Math.cos(midAngle) * labelRadius;
            const labelY = centerY + Math.sin(midAngle) * labelRadius;
            
            ctx.font = '11px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`第${i + 1}周期`, labelX, labelY);
        }
        
        currentAngle += segmentAngle;
    }
    
    const remainingAngle = totalAngle - minedAngle;
    if (remainingAngle > 0) {
        const gradient = ctx.createLinearGradient(0, 0, container.offsetWidth, container.offsetHeight);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#60a5fa');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + remainingAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + remainingAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        const midAngle = currentAngle + remainingAngle / 2;
        const labelRadius = radius + 20;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;
        
        ctx.font = '11px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('剩余', labelX, labelY);
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.progressPercent.toFixed(2) + '%', centerX, centerY);
    
    ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('已开采', centerX, centerY + 25);
}

function animateChart(data) {
    const canvas = document.getElementById('bitcoin-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    // 获取容器宽度，计算合适的高度
    const containerWidth = container.offsetWidth;
    let canvasHeight = 380; // 默认高度
    
    // 根据屏幕宽度调整高度
    if (window.innerWidth <= 480) {
        canvasHeight = 340;
    } else if (window.innerWidth <= 768) {
        canvasHeight = 380;
    } else {
        canvasHeight = containerWidth * 0.8; // 大屏幕上使用宽度的80%作为高度
    }
    
    // 设置canvas尺寸
    canvas.width = containerWidth * 2;
    canvas.height = canvasHeight * 2;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    ctx.scale(2, 2);
    
    const centerX = containerWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const innerRadius = radius * 0.6;
    
    const currentBlockHeight = calculateCurrentBlockHeight();
    const currentHalvingIndex = Math.floor(currentBlockHeight / BLOCKS_PER_HALVING);
    
    const colors = [
        { start: '#f97316', end: '#fb923c' },
        { start: '#fb923c', end: '#fbbf24' },
        { start: '#fbbf24', end: '#facc15' },
        { start: '#facc15', end: '#a3e635' },
        { start: '#a3e635', end: '#22c55e' },
        { start: '#22c55e', end: '#10b981' },
        { start: '#10b981', end: '#14b8a6' },
        { start: '#14b8a6', end: '#06b6d4' },
        { start: '#06b6d4', end: '#0ea5e9' },
        { start: '#0ea5e9', end: '#3b82f6' },
        { start: '#3b82f6', end: '#6366f1' },
        { start: '#6366f1', end: '#8b5cf6' },
        { start: '#8b5cf6', end: '#a855f7' },
        { start: '#a855f7', end: '#d946ef' },
        { start: '#d946ef', end: '#ec4899' },
        { start: '#ec4899', end: '#f43f5e' },
        { start: '#f43f5e', end: '#ef4444' },
        { start: '#ef4444', end: '#dc2626' },
        { start: '#dc2626', end: '#b91c1c' },
        { start: '#b91c1c', end: '#991b1b' },
        { start: '#991b1b', end: '#7f1d1d' },
        { start: '#7f1d1d', end: '#64748b' },
        { start: '#64748b', end: '#475569' },
        { start: '#475569', end: '#334155' },
        { start: '#334155', end: '#1e293b' },
        { start: '#1e293b', end: '#0f172a' }
    ];
    
    let progress = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        ctx.clearRect(0, 0, container.offsetWidth, container.offsetHeight);
        
        let currentAngle = -Math.PI / 2;
        const totalAngle = 2 * Math.PI;
        const minedBTC = calculateMinedBTC(currentBlockHeight);
        const progressPercent = (minedBTC / MAX_BTC_SUPPLY) * 100;
        const minedAngle = totalAngle * (progressPercent / 100) * easeProgress;
        
        let totalMinedInDisplayedPeriods = 0;
        for (let i = 0; i < halvingEvents.length; i++) {
            const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
            const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
            
            if (blocksInPeriod <= 0) {
                break;
            }
            
            const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
            totalMinedInDisplayedPeriods += minedInPeriod;
        }
        
        for (let i = 0; i < halvingEvents.length; i++) {
            const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
            const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
            
            if (blocksInPeriod <= 0) {
                break;
            }
            
            const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
            const periodRatio = totalMinedInDisplayedPeriods > 0 ? minedInPeriod / totalMinedInDisplayedPeriods : 0;
            const segmentAngle = minedAngle * periodRatio;
            
            const colorIndex = Math.min(i, colors.length - 1);
            const gradient = ctx.createLinearGradient(0, 0, container.offsetWidth, container.offsetHeight);
            gradient.addColorStop(0, colors[colorIndex].start);
            gradient.addColorStop(1, colors[colorIndex].end);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + segmentAngle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            
            if (i % 1 === 0 && progress > 0.8) {
                const midAngle = currentAngle + segmentAngle / 2;
                const labelRadius = radius + 20;
                const labelX = centerX + Math.cos(midAngle) * labelRadius;
                const labelY = centerY + Math.sin(midAngle) * labelRadius;
                
                ctx.font = '11px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = 'rgba(255,255, 255, 0.8)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`第${i + 1}周期`, labelX, labelY);
            }
            
            currentAngle += segmentAngle;
        }
        
        const remainingAngle = totalAngle - minedAngle;
        if (remainingAngle > 0) {
            const gradient = ctx.createLinearGradient(0, 0, container.offsetWidth, container.offsetHeight);
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#60a5fa');
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + remainingAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + remainingAngle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            
            if (progress > 0.8) {
                const midAngle = currentAngle + remainingAngle / 2;
                const labelRadius = radius + 20;
                const labelX = centerX + Math.cos(midAngle) * labelRadius;
                const labelY = centerY + Math.sin(midAngle) * labelRadius;
                
                ctx.font = '11px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = 'rgba(255,255, 255, 0.8)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('剩余', labelX, labelY);
            }
        }
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        const displayPercent = (data.progressPercent * easeProgress).toFixed(2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayPercent + '%', centerX, centerY);
        
        ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('已开采', centerX, centerY + 25);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function getTooltipContent(type, data) {
    const currentBlockHeight = calculateCurrentBlockHeight();
    const genesisDate = new Date('2009-01-03T00:00:00Z');
    const currentDate = new Date();
    const daysPassed = (currentDate - genesisDate) / (1000 * 60 * 60 * 24);
    const yearsPassed = daysPassed / 365.25;
    
    const currentHalvingIndex = Math.floor(currentBlockHeight / BLOCKS_PER_HALVING);
    const nextHalvingBlock = (currentHalvingIndex + 1) * BLOCKS_PER_HALVING;
    const blocksUntilNextHalving = nextHalvingBlock - currentBlockHeight;
    const daysUntilNextHalving = blocksUntilNextHalving * SECONDS_PER_BLOCK / (24 * 60 * 60);
    const nextHalvingDate = new Date(currentDate.getTime() + daysUntilNextHalving * 24 * 60 * 60 * 1000);
    
    const zeroRewardHalvingIndex = halvingEvents.findIndex(event => event.reward === 0);
    const zeroRewardBlockHeight = zeroRewardHalvingIndex >= 0 ? zeroRewardHalvingIndex * BLOCKS_PER_HALVING : null;
    
    let content = '';
    
    switch(type) {
        case 'mined':
            content = `
                <div class="tooltip-title">已开采总量详情</div>
                <div class="tooltip-item">
                    <div class="tooltip-label">已开采总量</div>
                    <div class="tooltip-value">${formatNumber(data.minedBTC)} BTC</div>
                    <div class="tooltip-description">比特币总供应量的 ${data.progressPercent.toFixed(2)}%</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">当前区块高度</div>
                    <div class="tooltip-value">${currentBlockHeight.toLocaleString()}</div>
                    <div class="tooltip-description">自 2009 年 1 月 3 日创世区块以来的总区块数</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">平均每日开采量</div>
                    <div class="tooltip-value">${formatNumber(data.minedBTC / daysPassed)} BTC</div>
                    <div class="tooltip-description">基于 ${daysPassed.toFixed(0)} 天的开采历史计算</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">开采历史</div>
                    <div class="tooltip-value">${function() {
                        const genesisDate = new Date('2009-01-03T00:00:00Z');
                        const currentDate = new Date();
                        
                        let years = currentDate.getFullYear() - genesisDate.getFullYear();
                        let months = currentDate.getMonth() - genesisDate.getMonth();
                        let days = currentDate.getDate() - genesisDate.getDate();
                        
                        if (days < 0) {
                            months--;
                            const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
                            days += lastMonth.getDate();
                        }
                        
                        if (months < 0) {
                            years--;
                            months += 12;
                        }
                        
                        return `${years}年${months}月${days}天`;
                    }()}</div>
                    <div class="tooltip-description">从创世区块到现在的总时间</div>
                </div>
            `;
            break;
        case 'remaining':
            content = `
                <div class="tooltip-title">剩余可开采详情</div>
                <div class="tooltip-item">
                    <div class="tooltip-label">剩余可开采</div>
                    <div class="tooltip-value">${formatNumber(data.remainingBTC)} BTC</div>
                    <div class="tooltip-description">比特币总供应量的 ${(100 - data.progressPercent).toFixed(2)}%</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">距离开采完成</div>
                    <div class="tooltip-value">${zeroRewardBlockHeight ? (zeroRewardBlockHeight - currentBlockHeight).toLocaleString() : '未知'} 区块</div>
                    <div class="tooltip-description">剩余需要开采的区块数量</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">剩余减半次数</div>
                    <div class="tooltip-value">${zeroRewardHalvingIndex - currentHalvingIndex} 次</div>
                    <div class="tooltip-description">在区块奖励降至 0 之前的减半次数</div>
                </div>
            `;
            break;
        case 'completion':
            content = `
                <div class="tooltip-title">预计开采完成详情</div>
                <div class="tooltip-item">
                    <div class="tooltip-label">预计开采完成年份</div>
                    <div class="tooltip-value">${data.estimatedCompletionYear}</div>
                    <div class="tooltip-description">当区块奖励降至 0 时的年份</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">距离开采完成</div>
                    <div class="tooltip-value">${data.estimatedCompletionYear !== '未知' ? data.estimatedCompletionYear - currentDate.getFullYear() : '未知'} 年</div>
                    <div class="tooltip-description">预计还需要多少年才能完成开采</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">开采完成时的区块高度</div>
                    <div class="tooltip-value">${zeroRewardBlockHeight ? zeroRewardBlockHeight.toLocaleString() : '未知'}</div>
                    <div class="tooltip-description">最后一个产生比特币奖励的区块</div>
                </div>
            `;
            break;
        case 'rate':
            content = `
                <div class="tooltip-title">当前开采率详情</div>
                <div class="tooltip-item">
                    <div class="tooltip-label">当前区块奖励</div>
                    <div class="tooltip-value">${data.currentReward.toFixed(8)} BTC</div>
                    <div class="tooltip-description">每个区块产生的比特币数量</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">下次减半时间</div>
                    <div class="tooltip-value">${nextHalvingDate.getFullYear()}年${nextHalvingDate.getMonth() + 1}月</div>
                    <div class="tooltip-description">预计在 ${daysUntilNextHalving.toFixed(0)} 天后，区块奖励将减半至 ${(data.currentReward / 2).toFixed(8)} BTC</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">距离下次减半</div>
                    <div class="tooltip-value">${blocksUntilNextHalving.toLocaleString()} 区块</div>
                    <div class="tooltip-description">约 ${daysUntilNextHalving.toFixed(0)} 天，${(daysUntilNextHalving / 30).toFixed(1)} 个月</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">当前减半周期</div>
                    <div class="tooltip-value">第 ${currentHalvingIndex + 1} 周期</div>
                    <div class="tooltip-description">自创世以来的第 ${currentHalvingIndex + 1} 次减半周期</div>
                </div>
            `;
            break;
        case 'mined-chart':
            content = `
                <div class="tooltip-title">已开采区域</div>
                <div class="tooltip-item">
                    <div class="tooltip-label">已开采总量</div>
                    <div class="tooltip-value">${formatNumber(data.minedBTC)} BTC</div>
                    <div class="tooltip-description">比特币总供应量的 ${data.progressPercent.toFixed(2)}%</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">当前区块高度</div>
                    <div class="tooltip-value">${currentBlockHeight.toLocaleString()}</div>
                    <div class="tooltip-description">已开采的总区块数</div>
                </div>
            `;
            break;
        case 'remaining-chart':
            content = `
                <div class="tooltip-title">剩余区域</div>
                <div class="tooltip-item">
                    <div class="tooltip-label">剩余可开采</div>
                    <div class="tooltip-value">${formatNumber(data.remainingBTC)} BTC</div>
                    <div class="tooltip-description">比特币总供应量的 ${(100 - data.progressPercent).toFixed(2)}%</div>
                </div>
                <div class="tooltip-item">
                    <div class="tooltip-label">剩余区块</div>
                    <div class="tooltip-value">${zeroRewardBlockHeight ? (zeroRewardBlockHeight - currentBlockHeight).toLocaleString() : '未知'} 区块</div>
                    <div class="tooltip-description">剩余需要开采的区块数量</div>
                </div>
            `;
            break;
        default:
            if (type.startsWith('halving-')) {
                const segmentIndex = parseInt(type.split('-')[1]);
                const halvingBlock = (segmentIndex + 1) * BLOCKS_PER_HALVING;
                const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (segmentIndex * BLOCKS_PER_HALVING);
                const periodProgress = blocksInPeriod / BLOCKS_PER_HALVING;
                const minedInPeriod = blocksInPeriod * halvingEvents[segmentIndex].reward;
                
                content = `
                    <div class="tooltip-title">第${segmentIndex + 1}减半周期</div>
                    <div class="tooltip-item">
                        <div class="tooltip-label">区块奖励</div>
                        <div class="tooltip-value">${halvingEvents[segmentIndex].reward.toFixed(8)} BTC</div>
                        <div class="tooltip-description">每个区块产生的比特币数量</div>
                    </div>
                    <div class="tooltip-item">
                        <div class="tooltip-label">周期年份</div>
                        <div class="tooltip-value">${halvingEvents[segmentIndex].year}年</div>
                        <div class="tooltip-description">该减半周期的开始年份</div>
                    </div>
                    <div class="tooltip-item">
                        <div class="tooltip-label">已开采</div>
                        <div class="tooltip-value">${formatNumber(minedInPeriod)} BTC</div>
                        <div class="tooltip-description">该周期已开采的比特币数量</div>
                    </div>
                    <div class="tooltip-item">
                        <div class="tooltip-label">周期进度</div>
                        <div class="tooltip-value">${(periodProgress * 100).toFixed(1)}%</div>
                        <div class="tooltip-description">该周期的开采进度</div>
                    </div>
                    <div class="tooltip-item">
                        <div class="tooltip-label">区块范围</div>
                        <div class="tooltip-value">${(segmentIndex * BLOCKS_PER_HALVING).toLocaleString()} - ${halvingBlock.toLocaleString()}</div>
                        <div class="tooltip-description">该周期的区块高度范围</div>
                    </div>
                `;
            }
            break;
    }
    
    return content;
}

function showTooltip(type, x, y) {
    const data = calculateMiningData();
    const tooltip = document.getElementById('tooltip');
    
    tooltip.innerHTML = getTooltipContent(type, data);
    tooltip.classList.add('active');
    
    // 强制重排，确保获取正确的尺寸
    tooltip.getBoundingClientRect();
    
    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let posX = x;
    let posY = y;
    
    // 对于图表上的悬停事件，根据鼠标位置智能调整提示框位置
    if (type.startsWith('halving-') || type === 'mined-chart' || type === 'remaining-chart') {
        const canvas = document.getElementById('bitcoin-chart');
        if (canvas) {
            const chartRect = canvas.getBoundingClientRect();
            const chartCenterX = chartRect.left + chartRect.width / 2;
            
            // 如果鼠标在图表左侧，提示框显示在左侧
            if (x < chartCenterX) {
                posX = x - tooltipRect.width - 15;
                // 确保不超出左边界
                if (posX < 0) {
                    posX = 15;
                }
            } else {
                // 如果鼠标在图表右侧，提示框显示在右侧
                posX = x + 15;
                // 确保不超出右边界
                if (posX + tooltipRect.width > windowWidth) {
                    posX = windowWidth - tooltipRect.width - 15;
                }
            }
            
            // 垂直位置调整：优先显示在鼠标下方
            posY = y + 15;
            
            // 检查底部边界
            if (posY + tooltipRect.height > windowHeight) {
                // 如果下方空间不足，显示在鼠标上方
                posY = y - tooltipRect.height - 15;
                // 检查顶部边界
                if (posY < 0) {
                    posY = 15;
                }
            }
        }
    } else {
        // 对于统计卡片，确保提示框不会挡住卡片
        if (type === 'mined' || type === 'remaining' || type === 'completion' || type === 'rate') {
            const statCards = document.querySelectorAll('.stat-card');
            let cardRect = null;
            statCards.forEach(card => {
                if (card.getAttribute('data-type') === type) {
                    cardRect = card.getBoundingClientRect();
                }
            });
            
            if (cardRect) {
                // 水平位置：显示在卡片右侧
                posX = cardRect.right + 15;
                // 确保不超出右边界
                if (posX + tooltipRect.width > windowWidth) {
                    posX = cardRect.left - tooltipRect.width - 15;
                    // 确保不超出左边界
                    if (posX < 0) {
                        posX = 15;
                    }
                }
                
                // 垂直位置：显示在卡片顶部
                posY = cardRect.top;
                // 检查底部边界
                if (posY + tooltipRect.height > windowHeight) {
                    posY = windowHeight - tooltipRect.height - 15;
                }
                // 检查顶部边界
                if (posY < 0) {
                    posY = 15;
                }
            }
        }
    }
    
    tooltip.style.left = posX + 'px';
    tooltip.style.top = posY + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('active');
}

function initTooltipEvents() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const type = card.getAttribute('data-type');
            if (type) {
                const rect = card.getBoundingClientRect();
                showTooltip(type, rect.right, rect.top);
            }
        });
        
        card.addEventListener('mouseleave', () => {
            hideTooltip();
        });
    });
}

function resetChart() {
    const data = calculateMiningData();
    animateChartReset(data);
    
    const infoContainer = document.getElementById('selected-segment-info');
    if (infoContainer) {
        const infoItems = infoContainer.querySelectorAll('.info-item');
        
        if (infoItems.length > 0) {
            infoItems.forEach((item, index) => {
                setTimeout(() => {
                    item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(10px)';
                }, index * 50);
            });
            
            setTimeout(() => {
                infoContainer.innerHTML = '<p class="info-placeholder">点击图表中的扇区查看详细信息</p>';
            }, infoItems.length * 50 + 300);
        } else {
            infoContainer.innerHTML = '<p class="info-placeholder">点击图表中的扇区查看详细信息</p>';
        }
    }
}

function animateChartReset(data) {
    const canvas = document.getElementById('bitcoin-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    // 获取容器宽度，计算合适的高度
    const containerWidth = container.offsetWidth;
    let canvasHeight = 380; // 默认高度
    
    // 根据屏幕宽度调整高度
    if (window.innerWidth <= 480) {
        canvasHeight = 340;
    } else if (window.innerWidth <= 768) {
        canvasHeight = 380;
    } else {
        canvasHeight = containerWidth * 0.8; // 大屏幕上使用宽度的80%作为高度
    }
    
    // 设置canvas尺寸
    canvas.width = containerWidth * 2;
    canvas.height = canvasHeight * 2;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    ctx.scale(2, 2);
    
    const centerX = containerWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const innerRadius = radius * 0.6;
    
    const currentBlockHeight = calculateCurrentBlockHeight();
    const currentHalvingIndex = Math.floor(currentBlockHeight / BLOCKS_PER_HALVING);
    
    const colors = [
        { start: '#f97316', end: '#fb923c' },
        { start: '#fb923c', end: '#fbbf24' },
        { start: '#fbbf24', end: '#facc15' },
        { start: '#facc15', end: '#a3e635' },
        { start: '#a3e635', end: '#22c55e' },
        { start: '#22c55e', end: '#10b981' },
        { start: '#10b981', end: '#14b8a6' },
        { start: '#14b8a6', end: '#06b6d4' },
        { start: '#06b6d4', end: '#0ea5e9' },
        { start: '#0ea5e9', end: '#3b82f6' },
        { start: '#3b82f6', end: '#6366f1' },
        { start: '#6366f1', end: '#8b5cf6' },
        { start: '#8b5cf6', end: '#a855f7' },
        { start: '#a855f7', end: '#d946ef' },
        { start: '#d946ef', end: '#ec4899' },
        { start: '#ec4899', end: '#f43f5e' },
        { start: '#f43f5e', end: '#ef4444' },
        { start: '#ef4444', end: '#dc2626' },
        { start: '#dc2626', end: '#b91c1c' },
        { start: '#b91c1c', end: '#991b1b' },
        { start: '#991b1b', end: '#7f1d1d' },
        { start: '#7f1d1d', end: '#64748b' },
        { start: '#64748b', end: '#475569' },
        { start: '#475569', end: '#334155' },
        { start: '#334155', end: '#1e293b' },
        { start: '#1e293b', end: '#0f172a' }
    ];
    
    let animationProgress = 0;
    const animationDuration = 300; // 动画持续时间（毫秒）
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        animationProgress = Math.min(elapsed / animationDuration, 1);
        
        ctx.clearRect(0, 0, containerWidth, canvasHeight);
        
        // 绘制各个减半阶段的扇区
        let cumulativeAngle = -Math.PI / 2;
        let totalMinedInDisplayedPeriods = 0;
        
        // 计算总开采量
        for (let i = 0; i < halvingEvents.length; i++) {
            const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
            const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
            
            if (blocksInPeriod <= 0) {
                break;
            }
            
            const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
            totalMinedInDisplayedPeriods += minedInPeriod;
        }
        
        // 绘制已开采的扇区
        for (let i = 0; i < halvingEvents.length; i++) {
            const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
            const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
            
            if (blocksInPeriod <= 0) {
                break;
            }
            
            const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
            const periodRatio = totalMinedInDisplayedPeriods > 0 ? minedInPeriod / totalMinedInDisplayedPeriods : 0;
            const segmentAngle = data.totalAngle * periodRatio;
            
            const colorIndex = Math.min(i, colors.length - 1);
            const gradient = ctx.createLinearGradient(0, 0, containerWidth, canvasHeight);
            gradient.addColorStop(0, colors[colorIndex].start);
            gradient.addColorStop(1, colors[colorIndex].end);
            
            // 计算当前半径（从放大状态过渡到正常状态）
            const currentRadius = radius + (20 * (1 - animationProgress));
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentRadius, cumulativeAngle, cumulativeAngle + segmentAngle);
            ctx.arc(centerX, centerY, innerRadius, cumulativeAngle + segmentAngle, cumulativeAngle, true);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            
            cumulativeAngle += segmentAngle;
        }
        
        // 绘制剩余区域
        const remainingAngle = 2 * Math.PI - data.totalAngle;
        if (remainingAngle > 0) {
            const remainingStartAngle = -Math.PI / 2 + data.totalAngle;
            const remainingEndAngle = remainingStartAngle + remainingAngle;
            
            const gradient = ctx.createLinearGradient(0, 0, containerWidth, canvasHeight);
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#60a5fa');
            
            // 计算当前半径（从放大状态过渡到正常状态）
            const remainingRadius = radius + (20 * (1 - animationProgress));
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, remainingRadius, remainingStartAngle, remainingEndAngle);
            ctx.arc(centerX, centerY, innerRadius, remainingEndAngle, remainingStartAngle, true);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        
        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // 绘制中心文字（渐进渐入）
        const centerTextOpacity = animationProgress;
        if (centerTextOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${centerTextOpacity})`;
            ctx.font = 'bold 32px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(data.progressPercent.toFixed(2) + '%', centerX, centerY);
            
            ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
            ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * centerTextOpacity})`;
            ctx.fillText('已开采', centerX, centerY + 25);
        }
        
        // 绘制外部文字标识（渐进渐入）
        const textOpacity = animationProgress;
        if (textOpacity > 0) {
            let cumulativeAngle = -Math.PI / 2;
            for (let i = 0; i < halvingEvents.length; i++) {
                const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
                const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
                
                if (blocksInPeriod <= 0) {
                    break;
                }
                
                const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
                const periodRatio = totalMinedInDisplayedPeriods > 0 ? minedInPeriod / totalMinedInDisplayedPeriods : 0;
                const segmentAngle = data.totalAngle * periodRatio;
                
                const midAngle = cumulativeAngle + segmentAngle / 2;
                const labelRadius = radius + 20;
                const labelX = centerX + Math.cos(midAngle) * labelRadius;
                const labelY = centerY + Math.sin(midAngle) * labelRadius;
                
                ctx.font = '11px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * textOpacity})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`第${i + 1}周期`, labelX, labelY);
                
                cumulativeAngle += segmentAngle;
            }
            
            // 绘制剩余区域的文字标识
            if (remainingAngle > 0) {
                const remainingMidAngle = -Math.PI / 2 + data.totalAngle + remainingAngle / 2;
                const remainingLabelRadius = radius + 20;
                const remainingLabelX = centerX + Math.cos(remainingMidAngle) * remainingLabelRadius;
                const remainingLabelY = centerY + Math.sin(remainingMidAngle) * remainingLabelRadius;
                
                ctx.font = '11px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * textOpacity})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('剩余', remainingLabelX, remainingLabelY);
            }
        }
        
        if (animationProgress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

function initChartHoverEvents() {
    const canvas = document.getElementById('bitcoin-chart');
    if (!canvas) return;
    
    let isZoomed = false;
    let zoomedSegment = -1;
    let selectedSegment = -1;
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const radius = Math.min(centerX, centerY) - 40;
        const innerRadius = radius * 0.6;
        
        if (distance >= innerRadius && distance <= radius) {
            const angle = Math.atan2(dy, dx);
            const normalizedAngle = angle + Math.PI / 2;
            const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
            
            const currentBlockHeight = calculateCurrentBlockHeight();
            const minedBTC = calculateMinedBTC(currentBlockHeight);
            const progressPercent = (minedBTC / MAX_BTC_SUPPLY) * 100;
            const minedAngle = 2 * Math.PI * (progressPercent / 100);
            
            if (positiveAngle <= minedAngle) {
                let totalMinedInDisplayedPeriods = 0;
                for (let i = 0; i < halvingEvents.length; i++) {
                    const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
                    const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
                    
                    if (blocksInPeriod <= 0) {
                        break;
                    }
                    
                    const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
                    totalMinedInDisplayedPeriods += minedInPeriod;
                }
                
                let cumulativeAngle = 0;
                let segmentIndex = -1;
                
                for (let i = 0; i < halvingEvents.length; i++) {
                    const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
                    const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
                    
                    if (blocksInPeriod <= 0) {
                        break;
                    }
                    
                    const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
                    const periodRatio = totalMinedInDisplayedPeriods > 0 ? minedInPeriod / totalMinedInDisplayedPeriods : 0;
                    const segmentAngle = minedAngle * periodRatio;
                    
                    if (positiveAngle >= cumulativeAngle && positiveAngle <= cumulativeAngle + segmentAngle) {
                        segmentIndex = i;
                        break;
                    }
                    
                    cumulativeAngle += segmentAngle;
                }
                
                if (segmentIndex >= 0) {
                    selectedSegment = segmentIndex;
                    animateSegmentGrowth(segmentIndex);
                }
            } else {
                selectedSegment = 'remaining';
                animateSegmentGrowth('remaining');
            }
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!canvas.contains(e.target)) {
            resetChart();
        }
    });
}

function drawZoomedChart(segmentIndex) {
    const canvas = document.getElementById('bitcoin-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    // 获取容器宽度，计算合适的高度
    const containerWidth = container.offsetWidth;
    let canvasHeight = 380; // 默认高度
    
    // 根据屏幕宽度调整高度
    if (window.innerWidth <= 480) {
        canvasHeight = 340;
    } else if (window.innerWidth <= 768) {
        canvasHeight = 380;
    } else {
        canvasHeight = containerWidth * 0.8; // 大屏幕上使用宽度的80%作为高度
    }
    
    // 设置canvas尺寸
    canvas.width = containerWidth * 2;
    canvas.height = canvasHeight * 2;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    ctx.scale(2, 2);
    
    const centerX = containerWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const innerRadius = radius * 0.6;
    
    const currentBlockHeight = calculateCurrentBlockHeight();
    
    const colors = [
        { start: '#f97316', end: '#fb923c' },
        { start: '#fb923c', end: '#fbbf24' },
        { start: '#fbbf24', end: '#facc15' },
        { start: '#facc15', end: '#a3e635' },
        { start: '#a3e635', end: '#22c55e' },
        { start: '#22c55e', end: '#10b981' },
        { start: '#10b981', end: '#14b8a6' },
        { start: '#14b8a6', end: '#06b6d4' },
        { start: '#06b6d4', end: '#0ea5e9' },
        { start: '#0ea5e9', end: '#3b82f6' },
        { start: '#3b82f6', end: '#6366f1' },
        { start: '#6366f1', end: '#8b5cf6' },
        { start: '#8b5cf6', end: '#a855f7' },
        { start: '#a855f7', end: '#d946ef' },
        { start: '#d946ef', end: '#ec4899' },
        { start: '#ec4899', end: '#f43f5e' },
        { start: '#f43f5e', end: '#ef4444' },
        { start: '#ef4444', end: '#dc2626' },
        { start: '#dc2626', end: '#b91c1c' },
        { start: '#b91c1c', end: '#991b1b' },
        { start: '#991b1b', end: '#7f1d1d' },
        { start: '#7f1d1d', end: '#64748b' },
        { start: '#64748b', end: '#475569' },
        { start: '#475569', end: '#334155' },
        { start: '#334155', end: '#1e293b' },
        { start: '#1e293b', end: '#0f172a' }
    ];
    
    ctx.clearRect(0, 0, container.offsetWidth, container.offsetHeight);
    
    if (segmentIndex === 'remaining') {
        const totalAngle = 2 * Math.PI;
        const minedBTC = calculateMinedBTC(currentBlockHeight);
        const progressPercent = (minedBTC / MAX_BTC_SUPPLY) * 100;
        const minedAngle = totalAngle * (progressPercent / 100);
        
        const remainingAngle = totalAngle - minedAngle;
        const remainingStartAngle = minedAngle - Math.PI / 2;
        const remainingEndAngle = remainingStartAngle + remainingAngle;
        
        const gradient = ctx.createLinearGradient(0, 0, container.offsetWidth, container.offsetHeight);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#60a5fa');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, remainingStartAngle, remainingEndAngle);
        ctx.arc(centerX, centerY, innerRadius, remainingEndAngle, remainingStartAngle, true);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        const remainingBTC = MAX_BTC_SUPPLY - minedBTC;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('剩余区域', centerX, centerY - 25);
        
        ctx.font = '18px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(`${remainingBTC.toFixed(2)} BTC`, centerX, centerY + 5);
        
        ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(`占总量 ${(100 - progressPercent).toFixed(2)}%`, centerX, centerY + 35);
        
        return;
    }
    
    const totalAngle = 2 * Math.PI;
    const minedBTC = calculateMinedBTC(currentBlockHeight);
    const progressPercent = (minedBTC / MAX_BTC_SUPPLY) * 100;
    const minedAngle = totalAngle * (progressPercent / 100);
    
    let totalMinedInDisplayedPeriods = 0;
    for (let i = 0; i < halvingEvents.length; i++) {
        const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
        const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
        
        if (blocksInPeriod <= 0) {
            break;
        }
        
        const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
        totalMinedInDisplayedPeriods += minedInPeriod;
    }
    
    let cumulativeAngle = -Math.PI / 2;
    let targetSegmentStartAngle = 0;
    let targetSegmentEndAngle = 0;
    let targetMinedInPeriod = 0;
    
    for (let i = 0; i < halvingEvents.length; i++) {
        const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
        const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
        
        if (blocksInPeriod <= 0) {
            break;
        }
        
        const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
        const periodRatio = totalMinedInDisplayedPeriods > 0 ? minedInPeriod / totalMinedInDisplayedPeriods : 0;
        const segmentAngle = minedAngle * periodRatio;
        
        if (i === segmentIndex) {
            targetSegmentStartAngle = cumulativeAngle;
            targetSegmentEndAngle = cumulativeAngle + segmentAngle;
            targetMinedInPeriod = minedInPeriod;
            break;
        }
        
        cumulativeAngle += segmentAngle;
    }
    
    const colorIndex = Math.min(segmentIndex, colors.length - 1);
    const gradient = ctx.createLinearGradient(0, 0, container.offsetWidth, container.offsetHeight);
    gradient.addColorStop(0, colors[colorIndex].start);
    gradient.addColorStop(1, colors[colorIndex].end);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, targetSegmentStartAngle, targetSegmentEndAngle);
    ctx.arc(centerX, centerY, innerRadius, targetSegmentEndAngle, targetSegmentStartAngle, true);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    
    const halvingBlock = (segmentIndex + 1) * BLOCKS_PER_HALVING;
    const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (segmentIndex * BLOCKS_PER_HALVING);
    const periodProgress = blocksInPeriod / BLOCKS_PER_HALVING;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第${segmentIndex + 1}周期`, centerX, centerY - 25);
    
    ctx.font = '18px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${halvingEvents[segmentIndex].reward} BTC/区块`, centerX, centerY - 5);
    
    ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`已完成 ${(periodProgress * 100).toFixed(1)}%`, centerX, centerY + 15);
    
    ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`已开采 ${targetMinedInPeriod.toFixed(2)} BTC`, centerX, centerY + 35);
    
    ctx.font = '12px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`${halvingEvents[segmentIndex].year}年`, centerX, centerY + 55);
}

function animateSegmentGrowth(segmentIndex) {
    const canvas = document.getElementById('bitcoin-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    canvas.width = container.offsetWidth * 2;
    canvas.height = container.offsetHeight * 2;
    canvas.style.width = container.offsetWidth + 'px';
    canvas.style.height = container.offsetHeight + 'px';
    ctx.scale(2, 2);
    
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const innerRadius = radius * 0.6;
    
    const currentBlockHeight = calculateCurrentBlockHeight();
    const minedBTC = calculateMinedBTC(currentBlockHeight);
    const progressPercent = (minedBTC / MAX_BTC_SUPPLY) * 100;
    const minedAngle = 2 * Math.PI * (progressPercent / 100);
    
    const colors = [
        { start: '#f97316', end: '#fb923c' },
        { start: '#fb923c', end: '#fbbf24' },
        { start: '#fbbf24', end: '#facc15' },
        { start: '#facc15', end: '#a3e635' },
        { start: '#a3e635', end: '#22c55e' },
        { start: '#22c55e', end: '#10b981' },
        { start: '#10b981', end: '#14b8a6' },
        { start: '#14b8a6', end: '#06b6d4' },
        { start: '#06b6d4', end: '#0ea5e9' },
        { start: '#0ea5e9', end: '#3b82f6' },
        { start: '#3b82f6', end: '#6366f1' },
        { start: '#6366f1', end: '#8b5cf6' },
        { start: '#8b5cf6', end: '#a855f7' },
        { start: '#a855f7', end: '#d946ef' },
        { start: '#d946ef', end: '#ec4899' },
        { start: '#ec4899', end: '#f43f5e' },
        { start: '#f43f5e', end: '#ef4444' },
        { start: '#ef4444', end: '#dc2626' },
        { start: '#dc2626', end: '#b91c1c' },
        { start: '#b91c1c', end: '#991b1b' },
        { start: '#991b1b', end: '#7f1d1d' },
        { start: '#7f1d1d', end: '#64748b' },
        { start: '#64748b', end: '#475569' },
        { start: '#475569', end: '#334155' },
        { start: '#334155', end: '#1e293b' },
        { start: '#1e293b', end: '#0f172a' }
    ];
    
    let animationProgress = 0;
    const animationDuration = 300; // 动画持续时间（毫秒）
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        animationProgress = Math.min(elapsed / animationDuration, 1);
        
        ctx.clearRect(0, 0, container.offsetWidth, container.offsetHeight);
        
        // 绘制未选中的扇区
        let totalMinedInDisplayedPeriods = 0;
        for (let i = 0; i < halvingEvents.length; i++) {
            const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
            const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
            
            if (blocksInPeriod <= 0) {
                break;
            }
            
            const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
            totalMinedInDisplayedPeriods += minedInPeriod;
        }
        
        let cumulativeAngle = -Math.PI / 2;
        for (let i = 0; i < halvingEvents.length; i++) {
            const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
            const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
            
            if (blocksInPeriod <= 0) {
                break;
            }
            
            const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
            const periodRatio = totalMinedInDisplayedPeriods > 0 ? minedInPeriod / totalMinedInDisplayedPeriods : 0;
            const segmentAngle = minedAngle * periodRatio;
            
            const isSelected = i === segmentIndex;
            const currentRadius = isSelected 
                ? radius + (20 * animationProgress) // 选中的扇区半径增大
                : radius;
            
            const colorIndex = Math.min(i, colors.length - 1);
            const gradient = ctx.createLinearGradient(0, 0, container.offsetWidth, container.offsetHeight);
            gradient.addColorStop(0, colors[colorIndex].start);
            gradient.addColorStop(1, colors[colorIndex].end);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentRadius, cumulativeAngle, cumulativeAngle + segmentAngle);
            ctx.arc(centerX, centerY, innerRadius, cumulativeAngle + segmentAngle, cumulativeAngle, true);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            
            cumulativeAngle += segmentAngle;
        }
        
        // 绘制剩余区域
        const remainingAngle = 2 * Math.PI - minedAngle;
        const isRemainingSelected = segmentIndex === 'remaining';
        const remainingRadius = isRemainingSelected 
            ? radius + (20 * animationProgress) // 选中的扇区半径增大
            : radius;
        
        if (remainingAngle > 0) {
            const remainingStartAngle = -Math.PI / 2 + minedAngle;
            const remainingEndAngle = remainingStartAngle + remainingAngle;
            
            const gradient = ctx.createLinearGradient(0, 0, container.offsetWidth, container.offsetHeight);
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#60a5fa');
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, remainingRadius, remainingStartAngle, remainingEndAngle);
            ctx.arc(centerX, centerY, innerRadius, remainingEndAngle, remainingStartAngle, true);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        
        // 绘制外部文字标识（渐进渐出）
        const textOpacity = 1 - animationProgress;
        if (textOpacity > 0) {
            let cumulativeAngle = -Math.PI / 2;
            for (let i = 0; i < halvingEvents.length; i++) {
                const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
                const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
                
                if (blocksInPeriod <= 0) {
                    break;
                }
                
                const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
                const periodRatio = totalMinedInDisplayedPeriods > 0 ? minedInPeriod / totalMinedInDisplayedPeriods : 0;
                const segmentAngle = minedAngle * periodRatio;
                
                const midAngle = cumulativeAngle + segmentAngle / 2;
                const labelRadius = radius + 20;
                const labelX = centerX + Math.cos(midAngle) * labelRadius;
                const labelY = centerY + Math.sin(midAngle) * labelRadius;
                
                ctx.font = '11px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * textOpacity})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`第${i + 1}周期`, labelX, labelY);
                
                cumulativeAngle += segmentAngle;
            }
            
            // 绘制剩余区域的文字标识
            if (remainingAngle > 0) {
                const remainingMidAngle = -Math.PI / 2 + minedAngle + remainingAngle / 2;
                const remainingLabelRadius = radius + 20;
                const remainingLabelX = centerX + Math.cos(remainingMidAngle) * remainingLabelRadius;
                const remainingLabelY = centerY + Math.sin(remainingMidAngle) * remainingLabelRadius;
                
                ctx.font = '11px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * textOpacity})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('剩余', remainingLabelX, remainingLabelY);
            }
        }
        
        // 绘制中心文字（渐进渐出）
        const centerTextOpacity = 1 - animationProgress;
        if (centerTextOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${centerTextOpacity})`;
            ctx.font = 'bold 24px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('94.66%', centerX, centerY - 10);
            ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
            ctx.fillText('已开采', centerX, centerY + 15);
        }
        
        // 绘制选中区域的文字（渐进渐入）
        const selectedTextOpacity = animationProgress;
        if (selectedTextOpacity > 0) {
            if (segmentIndex === 'remaining') {
                const remainingBTC = MAX_BTC_SUPPLY - calculateMinedBTC(currentBlockHeight);
                const progressPercent = (minedBTC / MAX_BTC_SUPPLY) * 100;
                const remainingPercent = 100 - progressPercent;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${selectedTextOpacity})`;
                ctx.font = 'bold 20px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('剩余区域', centerX, centerY - 25);
                
                ctx.font = '18px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * selectedTextOpacity})`;
                ctx.fillText(`${remainingBTC.toFixed(2)} BTC`, centerX, centerY + 5);
                
                ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * selectedTextOpacity})`;
                ctx.fillText(`占总量 ${remainingPercent.toFixed(2)}%`, centerX, centerY + 35);
            } else if (segmentIndex >= 0 && segmentIndex < halvingEvents.length) {
                const halvingBlock = (segmentIndex + 1) * BLOCKS_PER_HALVING;
                const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (segmentIndex * BLOCKS_PER_HALVING);
                const periodProgress = blocksInPeriod / BLOCKS_PER_HALVING;
                
                let totalMinedInDisplayedPeriods = 0;
                for (let i = 0; i < halvingEvents.length; i++) {
                    const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
                    const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
                    
                    if (blocksInPeriod <= 0) {
                        break;
                    }
                    
                    const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
                    totalMinedInDisplayedPeriods += minedInPeriod;
                }
                
                let cumulativeAngle = -Math.PI / 2;
                let targetMinedInPeriod = 0;
                
                for (let i = 0; i <= segmentIndex; i++) {
                    const halvingBlock = (i + 1) * BLOCKS_PER_HALVING;
                    const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (i * BLOCKS_PER_HALVING);
                    
                    if (blocksInPeriod <= 0) {
                        break;
                    }
                    
                    const minedInPeriod = blocksInPeriod * halvingEvents[i].reward;
                    if (i === segmentIndex) {
                        targetMinedInPeriod = minedInPeriod;
                    }
                }
                
                ctx.fillStyle = `rgba(255, 255, 255, ${selectedTextOpacity})`;
                ctx.font = 'bold 20px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`第${segmentIndex + 1}周期`, centerX, centerY - 25);
                
                ctx.font = '16px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * selectedTextOpacity})`;
                ctx.fillText(`${halvingEvents[segmentIndex].reward} BTC/区块`, centerX, centerY - 5);
                
                ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * selectedTextOpacity})`;
                ctx.fillText(`已完成 ${(periodProgress * 100).toFixed(1)}%`, centerX, centerY + 15);
                
                ctx.font = '14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * selectedTextOpacity})`;
                ctx.fillText(`已开采 ${targetMinedInPeriod.toFixed(2)} BTC`, centerX, centerY + 35);
                
                ctx.font = '12px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * selectedTextOpacity})`;
                ctx.fillText(`${halvingEvents[segmentIndex].year}年`, centerX, centerY + 55);
            }
        }
        
        if (animationProgress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 动画结束后，更新右侧文本展示
            updateSelectedSegmentInfo(segmentIndex);
        }
    }
    
    animate();
}

function updateSelectedSegmentInfo(segmentIndex) {
    const infoContainer = document.getElementById('selected-segment-info');
    if (!infoContainer) return;
    
    const currentBlockHeight = calculateCurrentBlockHeight();
    const data = calculateMiningData();
    
    let html = '';
    
    if (segmentIndex === 'remaining') {
        const remainingBTC = MAX_BTC_SUPPLY - calculateMinedBTC(currentBlockHeight);
        const remainingPercent = (remainingBTC / MAX_BTC_SUPPLY) * 100;
        
        // 计算预计还有多少次减半
        const currentHalvingIndex = Math.floor(currentBlockHeight / BLOCKS_PER_HALVING);
        const totalHalvingEvents = halvingEvents.length - 1; // 减去最后一个奖励为0的事件
        const remainingHalvings = totalHalvingEvents - currentHalvingIndex;
        
        html = `
            <div class="info-item">
                <div class="info-label">区域类型</div>
                <div class="info-value">剩余</div>
                <div class="info-description">尚未开采的比特币数量</div>
            </div>
            <div class="info-item">
                <div class="info-label">剩余数量</div>
                <div class="info-value animated-number" data-target="${remainingBTC.toFixed(2)}">0.00</div>
                <div class="info-description">占总量的 <span class="animated-number" data-target="${remainingPercent.toFixed(2)}">0.00</span>%</div>
            </div>
            <div class="info-item">
                <div class="info-label">预计完成时间</div>
                <div class="info-value"><span class="animated-number" data-target="${data.estimatedCompletionYear}">2009</span>年</div>
                <div class="info-description">当区块奖励降至0时</div>
            </div>
            <div class="info-item">
                <div class="info-label">预计还有多少次减半</div>
                <div class="info-value animated-number" data-target="${remainingHalvings}">0</div>
                <div class="info-description">直到区块奖励降至0</div>
            </div>
        `;
    } else if (segmentIndex >= 0 && segmentIndex < halvingEvents.length) {
        const halvingBlock = (segmentIndex + 1) * BLOCKS_PER_HALVING;
        const blocksInPeriod = Math.min(halvingBlock, currentBlockHeight) - (segmentIndex * BLOCKS_PER_HALVING);
        const periodProgress = blocksInPeriod / BLOCKS_PER_HALVING;
        const minedInPeriod = blocksInPeriod * halvingEvents[segmentIndex].reward;
        
        html = `
            <div class="info-item">
                <div class="info-label">区域类型</div>
                <div class="info-value">第${segmentIndex + 1}周期</div>
                <div class="info-description">比特币减半周期</div>
            </div>
            <div class="info-item">
                <div class="info-label">区块奖励</div>
                <div class="info-value">${halvingEvents[segmentIndex].reward} BTC</div>
                <div class="info-description">每个区块产生的比特币数量</div>
            </div>
            <div class="info-item">
                <div class="info-label">已开采数量</div>
                <div class="info-value animated-number" data-target="${minedInPeriod.toFixed(2)}">0.00</div>
                <div class="info-description">该周期已开采的比特币数量</div>
            </div>
            <div class="info-item">
                <div class="info-label">完成进度</div>
                <div class="info-value"><span class="animated-number" data-target="${(periodProgress * 100).toFixed(1)}">0.0</span>%</div>
                <div class="info-description">该周期的开采进度</div>
            </div>
            <div class="info-item">
                <div class="info-label">周期年份</div>
                <div class="info-value"><span class="animated-number" data-target="${halvingEvents[segmentIndex].year}">2009</span>年</div>
                <div class="info-description">该减半周期的开始年份</div>
            </div>
        `;
    }
    
    infoContainer.innerHTML = html;
    
    const infoItems = infoContainer.querySelectorAll('.info-item');
    infoItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = 'none';
        
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 50);
    });
    
    animateNumbers();
}

function animateNumbers() {
    const animatedNumbers = document.querySelectorAll('.animated-number');
    
    animatedNumbers.forEach(element => {
        const target = parseFloat(element.dataset.target);
        const duration = 500;
        const startTime = Date.now();
        const startValue = 0;
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (target - startValue) * easeOutQuart;
            
            if (target % 1 === 0) {
                element.textContent = Math.round(currentValue);
            } else if (target.toString().split('.')[1].length === 1) {
                element.textContent = currentValue.toFixed(1);
            } else {
                element.textContent = currentValue.toFixed(2);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        animate();
    });
}

function init() {
    const data = updateStats();
    animateChart(data);
    
    setInterval(() => {
        const newData = updateStats();
        drawChart(newData);
    }, 60000);
    
    window.addEventListener('resize', () => {
        const data = calculateMiningData();
        drawChart(data);
    });
    
    initTooltipEvents();
    initChartHoverEvents();
}

document.addEventListener('DOMContentLoaded', init);