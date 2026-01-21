// ฟังก์ชัน utility สำหรับจัดการระบบ

export const getSystemDisplayName = (system: string | number): string => {
    if (typeof system === 'number') {
        // แปลงตัวเลขเป็น string key
        const systemKeys = ['brake', 'steering', 'motor', 'electric'];
        system = systemKeys[system] || system.toString();
    }

    const systemMap: { [key: string]: string } = {
        'brake': 'ระบบเบรก',
        'steering': 'ระบบบังคับเลี้ยว',
        'motor': 'ระบบมอเตอร์',
        'electric': 'ระบบไฟฟ้า',
        '0': 'ระบบเบรก',
        '1': 'ระบบบังคับเลี้ยว',
        '2': 'ระบบมอเตอร์',
        '3': 'ระบบไฟฟ้า'
    };

    return systemMap[system.toString()] || `ระบบ${system}`;
};

export const getSystemIcon = (system: string | number): string => {
    if (typeof system === 'number') {
        // แปลงตัวเลขเป็น string key
        const systemKeys = ['brake', 'steering', 'motor', 'electric'];
        system = systemKeys[system] || system.toString();
    }

    const systemIcons: { [key: string]: string } = {
        'brake': '🛑',
        'steering': '🎯',
        'motor': '⚙️',
        'electric': '⚡',
        '0': '🛑',
        '1': '🎯',
        '2': '⚙️',
        '3': '⚡'
    };

    return systemIcons[system.toString()] || '🔧';
};

export const getSystemKey = (system: string | number): string => {
    if (typeof system === 'number') {
        const systemKeys = ['brake', 'steering', 'motor', 'electric'];
        return systemKeys[system] || system.toString();
    }

    // ถ้าเป็น string แล้วเป็นตัวเลข ให้แปลง
    if (['0', '1', '2', '3'].includes(system.toString())) {
        const systemKeys = ['brake', 'steering', 'motor', 'electric'];
        return systemKeys[parseInt(system)] || system;
    }

    return system;
};

export const SYSTEM_OPTIONS = [
    { key: 'brake', name: 'ระบบเบรก', icon: '🛑' },
    { key: 'steering', name: 'ระบบบังคับเลี้ยว', icon: '🎯' },
    { key: 'motor', name: 'ระบบมอเตอร์', icon: '⚙️' },
    { key: 'electric', name: 'ระบบไฟฟ้า', icon: '⚡' }
];