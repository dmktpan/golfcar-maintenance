const API_BASE_URL = 'http://localhost:3000';

async function testJobsWithParts() {
    try {
        console.log('🔍 Testing Jobs with Parts Integration...');
        
        // ดึงข้อมูล jobs
        const jobsResponse = await fetch(`${API_BASE_URL}/api/proxy/jobs`);
        const jobsData = await jobsResponse.json();
        
        // ดึงข้อมูล parts usage logs
        const partsResponse = await fetch(`${API_BASE_URL}/api/proxy/parts-usage-logs`);
        const partsData = await partsResponse.json();
        
        console.log('📦 Data Summary:', {
            jobs: {
                success: jobsData.success,
                count: Array.isArray(jobsData.data) ? jobsData.data.length : 0
            },
            parts: {
                success: partsData.success,
                count: Array.isArray(partsData.data) ? partsData.data.length : 0
            }
        });
        
        if (jobsData.success && partsData.success && 
            Array.isArray(jobsData.data) && Array.isArray(partsData.data)) {
            
            // สร้าง map ของ parts ตาม jobId
            const partsMap = new Map();
            partsData.data.forEach((partLog) => {
                if (partLog.jobId) {
                    if (!partsMap.has(partLog.jobId)) {
                        partsMap.set(partLog.jobId, []);
                    }
                    partsMap.get(partLog.jobId).push(partLog);
                }
            });
            
            console.log('🔧 Parts Map:', {
                totalParts: partsData.data.length,
                jobsWithParts: partsMap.size,
                partsMapEntries: Array.from(partsMap.entries()).map(([jobId, parts]) => ({
                    jobId,
                    partsCount: parts.length,
                    parts: parts.map(p => ({ partName: p.partName, quantity: p.quantityUsed }))
                }))
            });
            
            // ตรวจสอบ jobs ที่มี parts
            const jobsWithParts = jobsData.data.filter(job => partsMap.has(job.id));
            console.log('🔗 Jobs with Parts:', {
                totalJobs: jobsData.data.length,
                jobsWithParts: jobsWithParts.length,
                sampleJobsWithParts: jobsWithParts.slice(0, 3).map(job => ({
                    id: job.id,
                    vehicle_number: job.vehicle_number,
                    status: job.status,
                    parts: partsMap.get(job.id).map(p => ({
                        partName: p.partName,
                        quantity: p.quantityUsed
                    }))
                }))
            });
            
            // ทดสอบการสร้างข้อความ parts สำหรับ Excel
            console.log('📊 Excel Parts Text Examples:');
            jobsWithParts.slice(0, 3).forEach(job => {
                const jobParts = partsMap.get(job.id) || [];
                const partsText = jobParts.length > 0 ? 
                    jobParts.map(partLog => `${partLog.partName} (จำนวน ${partLog.quantityUsed || 1})`).join(', ') : '-';
                
                console.log(`  Job ${job.vehicle_number}: "${partsText}"`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error testing jobs with parts:', error);
    }
}

// รันการทดสอบ
testJobsWithParts().catch(console.error);