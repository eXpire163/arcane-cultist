// IdleOn Arcane Item Analyzer - JavaScript

function analyzeData() {
    const jsonDataText = document.getElementById('jsonData').value.trim();
    const playerNumber = parseInt(document.getElementById('playerNumber').value);
    const messageDiv = document.getElementById('message');
    const resultsDiv = document.getElementById('results');

    // Clear previous messages
    messageDiv.innerHTML = '';
    resultsDiv.classList.add('hidden');

    // Validate inputs
    if (!jsonDataText) {
        showMessage('Please paste your IdleOn JSON data.', 'error');
        return;
    }

    if (isNaN(playerNumber) || playerNumber < 1 || playerNumber > 10) {
        showMessage('Please enter a valid character number between 1 and 10.', 'error');
        return;
    }

    // Parse JSON data
    let data;
    try {
        data = JSON.parse(jsonDataText);
        showMessage('✓ JSON data loaded successfully!', 'success');
    } catch (e) {
        showMessage('❌ Error: Invalid JSON format. Please make sure you copied the data correctly.', 'error');
        return;
    }

    // Convert player number to 0-indexed character ID
    const charId = playerNumber - 1;

    console.log('=== DEBUG INFO ===');
    console.log('Player Number:', playerNumber);
    console.log('Character ID (0-indexed):', charId);
    console.log('Looking for keys:', `InventoryOrder_${charId}`, `IMm_${charId}`);
    console.log('Available keys in data:', Object.keys(data).filter(k => k.startsWith('InventoryOrder_') || k.startsWith('IMm_')));

    try {
        // Find all wands and rings
        const allWands = findAllWands(data, charId);
        const allRings = findAllRings(data, charId);

        console.log('Wands found:', allWands.length);
        console.log('Rings found:', allRings.length);

        if (allWands.length === 0 && allRings.length === 0) {
            const debugInfo = `
                <strong>Debug Information:</strong><br>
                Character ID: ${charId} (from player ${playerNumber})<br>
                Looking for: InventoryOrder_${charId} and IMm_${charId}<br>
                Available inventory keys: ${Object.keys(data).filter(k => k.startsWith('InventoryOrder_')).join(', ') || 'None found'}<br>
                Available stats keys: ${Object.keys(data).filter(k => k.startsWith('IMm_')).join(', ') || 'None found'}<br>
                <br>Please check the console (F12) for more details.
            `;
            showMessage(`No Arcane items found for Character ${playerNumber}.<br><br>${debugInfo}`, 'error');
            return;
        }

        // Get top items
        const topWands = getTopWands(allWands, 5);
        const topRingsStat1 = getTopRingsByStat(allRings, 1, 5);
        const topRingsStat2 = getTopRingsByStat(allRings, 2, 5);

        // Display results
        displayWandsTable(topWands);
        displayRingsTable(topRingsStat1, 'ringsStat1Table');
        displayRingsTable(topRingsStat2, 'ringsStat2Table');

        showMessage(`✓ Found ${allWands.length} Arcane wands and ${allRings.length} Arcane rings for Character ${playerNumber}!`, 'success');
        resultsDiv.classList.remove('hidden');
    } catch (e) {
        showMessage(`❌ Error analyzing data: ${e.message}`, 'error');
        console.error(e);
    }
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.className = type;
    messageDiv.innerHTML = message;
}

function findAllWands(data, charId) {
    const wands = [];
    const inventoryKey = `InventoryOrder_${charId}`;
    const statsKey = `IMm_${charId}`;

    console.log(`[findAllWands] Looking for ${inventoryKey} and ${statsKey}`);
    console.log(`[findAllWands] Has inventory key:`, inventoryKey in data);
    console.log(`[findAllWands] Has stats key:`, statsKey in data);

    if (!data[inventoryKey] || !data[statsKey]) {
        console.log('[findAllWands] Missing inventory or stats key, returning empty array');
        return wands;
    }

    const inventoryOrder = data[inventoryKey];
    console.log(`[findAllWands] Inventory length:`, inventoryOrder.length);

    let statsDict;

    try {
        statsDict = JSON.parse(data[statsKey]);
        console.log(`[findAllWands] Stats parsed successfully, keys:`, Object.keys(statsDict).length);
    } catch (e) {
        console.log('[findAllWands] Error parsing stats:', e);
        return wands;
    }

    let arcaneWandCount = 0;
    for (let slotNum = 0; slotNum < inventoryOrder.length; slotNum++) {
        const itemId = inventoryOrder[slotNum];

        if (itemId === 'EquipmentWandsArc0') {
            arcaneWandCount++;
            const slotKey = slotNum.toString();
            console.log(`[findAllWands] Found EquipmentWandsArc0 at slot ${slotNum}, has stats:`, slotKey in statsDict);
            if (statsDict[slotKey] && statsDict[slotKey].Weapon_Power !== undefined) {
                console.log(`[findAllWands] Adding wand with weapon power:`, statsDict[slotKey].Weapon_Power);
                wands.push({
                    charId: charId,
                    slot: slotNum,
                    itemId: itemId,
                    stats: statsDict[slotKey]
                });
            }
        }
    }

    console.log(`[findAllWands] Total EquipmentWandsArc0 found: ${arcaneWandCount}, with valid stats: ${wands.length}`);
    return wands;
}

function findAllRings(data, charId) {
    const rings = [];
    const inventoryKey = `InventoryOrder_${charId}`;
    const statsKey = `IMm_${charId}`;

    console.log(`[findAllRings] Looking for ${inventoryKey} and ${statsKey}`);
    console.log(`[findAllRings] Has inventory key:`, inventoryKey in data);
    console.log(`[findAllRings] Has stats key:`, statsKey in data);

    if (!data[inventoryKey] || !data[statsKey]) {
        console.log('[findAllRings] Missing inventory or stats key, returning empty array');
        return rings;
    }

    const inventoryOrder = data[inventoryKey];
    console.log(`[findAllRings] Inventory length:`, inventoryOrder.length);

    let statsDict;

    try {
        statsDict = JSON.parse(data[statsKey]);
        console.log(`[findAllRings] Stats parsed successfully, keys:`, Object.keys(statsDict).length);
    } catch (e) {
        console.log('[findAllRings] Error parsing stats:', e);
        return rings;
    }

    let arcaneRingCount = 0;
    for (let slotNum = 0; slotNum < inventoryOrder.length; slotNum++) {
        const itemId = inventoryOrder[slotNum];

        if (itemId === 'EquipmentRingsArc0') {
            arcaneRingCount++;
            const slotKey = slotNum.toString();
            console.log(`[findAllRings] Found EquipmentRingsArc0 at slot ${slotNum}, has stats:`, slotKey in statsDict);
            if (statsDict[slotKey] && (statsDict[slotKey].UQ1val !== undefined || statsDict[slotKey].UQ2val !== undefined)) {
                console.log(`[findAllRings] Adding ring with stats:`, statsDict[slotKey].UQ1val, statsDict[slotKey].UQ2val);
                rings.push({
                    charId: charId,
                    slot: slotNum,
                    itemId: itemId,
                    stats: statsDict[slotKey]
                });
            }
        }
    }

    console.log(`[findAllRings] Total EquipmentRingsArc0 found: ${arcaneRingCount}, with valid stats: ${rings.length}`);
    return rings;
}

function getTopWands(wands, topN) {
    const wandInfo = wands.map(wand => {
        const bucketNum = Math.floor(wand.slot / 16) + 1;
        const positionInBucket = (wand.slot % 16) + 1;

        return {
            character: `Character_${wand.charId}`,
            bucket: bucketNum,
            position: positionInBucket,
            slot: wand.slot,
            itemType: wand.itemId,
            weaponPower: wand.stats.Weapon_Power || 0,
            uq1val: wand.stats.UQ1val || 0,
            uq2val: wand.stats.UQ2val || 0,
            uq1txt: wand.stats.UQ1txt || 'Unknown',
            uq2txt: wand.stats.UQ2txt || 'Unknown',
            wis: wand.stats.WIS || 0,
            upgrades: Math.abs(wand.stats.Upgrade_Slots_Left || 0)
        };
    });

    wandInfo.sort((a, b) => b.weaponPower - a.weaponPower);
    return wandInfo.slice(0, topN);
}

function getTopRingsByStat(rings, statNum, topN) {
    const ringInfo = rings.map(ring => {
        const bucketNum = Math.floor(ring.slot / 16) + 1;
        const positionInBucket = (ring.slot % 16) + 1;

        return {
            character: `Character_${ring.charId}`,
            bucket: bucketNum,
            position: positionInBucket,
            slot: ring.slot,
            itemType: ring.itemId,
            uq1val: ring.stats.UQ1val || 0,
            uq2val: ring.stats.UQ2val || 0,
            uq1txt: ring.stats.UQ1txt || 'Unknown',
            uq2txt: ring.stats.UQ2txt || 'Unknown',
            wis: ring.stats.WIS || 0,
            defence: ring.stats.Defence || 0,
            upgrades: Math.abs(ring.stats.Upgrade_Slots_Left || 0)
        };
    });

    if (statNum === 1) {
        ringInfo.sort((a, b) => b.uq1val - a.uq1val);
    } else {
        ringInfo.sort((a, b) => b.uq2val - a.uq2val);
    }

    return ringInfo.slice(0, topN);
}

function displayWandsTable(wands) {
    const tableDiv = document.getElementById('wandsTable');

    if (wands.length === 0) {
        tableDiv.innerHTML = '<p style="text-align: center; color: #888;">No Arcane wands found.</p>';
        return;
    }

    let html = '<table><thead><tr>';
    html += '<th>Rank</th>';
    html += '<th>Character</th>';
    html += '<th>Bucket<br>(Page)</th>';
    html += '<th>Position<br>(1-16)</th>';
    html += '<th>Weapon<br>Power</th>';
    html += '<th>Unique Stat 1</th>';
    html += '<th>Unique Stat 2</th>';
    html += '<th>WIS</th>';
    html += '<th>Upgrades</th>';
    html += '</tr></thead><tbody>';

    wands.forEach((wand, index) => {
        html += '<tr>';
        html += `<td class="rank-cell">${index + 1}</td>`;
        html += `<td>${wand.character}</td>`;
        html += `<td>${wand.bucket}</td>`;
        html += `<td>${wand.position}</td>`;
        ;
        html += `<td><strong>${wand.weaponPower}</strong></td>`;
        html += `<td>${wand.uq1val}% (${wand.uq1txt})</td>`;
        html += `<td>${wand.uq2val}% (${wand.uq2txt})</td>`;
        html += `<td>${wand.wis}</td>`;
        html += `<td>${wand.upgrades}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    tableDiv.innerHTML = html;
}

function displayRingsTable(rings, tableId) {
    const tableDiv = document.getElementById(tableId);

    if (rings.length === 0) {
        tableDiv.innerHTML = '<p style="text-align: center; color: #888;">No Arcane rings found.</p>';
        return;
    }

    let html = '<table><thead><tr>';
    html += '<th>Rank</th>';
    html += '<th>Character</th>';
    html += '<th>Bucket<br>(Page)</th>';
    html += '<th>Position<br>(1-16)</th>';
    html += '<th>Unique Stat 1</th>';
    html += '<th>Unique Stat 2</th>';
    html += '<th>WIS</th>';
    html += '<th>Defence</th>';
    html += '<th>Upgrades</th>';
    html += '</tr></thead><tbody>';

    rings.forEach((ring, index) => {
        html += '<tr>';
        html += `<td class="rank-cell">${index + 1}</td>`;
        html += `<td>${ring.character}</td>`;
        html += `<td>${ring.bucket}</td>`;
        html += `<td>${ring.position}</td>`;
        html += `<td>${ring.uq1val}% (${ring.uq1txt})</td>`;
        html += `<td>${ring.uq2val}% (${ring.uq2txt})</td>`;
        html += `<td>${ring.wis}</td>`;
        html += `<td>${ring.defence}</td>`;
        html += `<td>${ring.upgrades}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    tableDiv.innerHTML = html;
}
