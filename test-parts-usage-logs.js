const API_BASE_URL = 'http://localhost:3000';

async function testPartsUsageLogs() {
    try {
        console.log('🔍 Testing Parts Usage Logs API...');
        
        const response = await fetch(`${API_BASE_URL}/api/proxy/parts-usage-logs`);
        const data = await response.json();
        
        console.log('📦 Parts Usage Logs Response:', {
            success: data.success,
            dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
            dataLength: Array.isArray(data.data) ? data.data.length : 'N/A'
        });
        
        if (data.success && data.data && Array.isArray(data.data)) {
            console.log('🔧 Sample parts usage logs:');
            data.data.slice(0, 5).forEach((partLog, index) => {
                console.log(`  ${index + 1}:`, {
                    id: partLog.id,
                    jobId: partLog.jobId,
                    partId: partLog.partId,
                    partName: partLog.partName,
                    quantityUsed: partLog.quantityUsed,
                    vehicleNumber: partLog.vehicleNumber,
                    usedBy: partLog.usedBy,
                    usedDate: partLog.usedDate,
                    allFields: Object.keys(partLog)
                });
            });
            
            // ตรวจสอบว่ามี parts ที่เชื่อมโยงกับ jobs หรือไม่
            const partsWithJobId = data.data.filter(part => part.jobId);
            console.log(`🔗 Parts with jobId: ${partsWithJobId.length} out of ${data.data.length}`);
            
            if (partsWithJobId.length > 0) {
                console.log('🔗 Sample parts with jobId:', partsWithJobId.slice(0, 3));
            }
            
            // แสดงข้อมูลทั้งหมดของ parts usage logs
            console.log('📋 All parts usage logs data:');
            data.data.forEach((partLog, index) => {
                console.log(`  Part ${index + 1}:`, partLog);
            });
        } else {
            console.log('❌ No parts usage logs data found');
        }
        
    } catch (error) {
        console.error('❌ Error testing parts usage logs:', error);
    }
}

// รันการทดสอบ
testPartsUsageLogs().catch(console.error);