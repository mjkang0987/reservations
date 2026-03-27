export interface ServiceItem {
    name: string;
    durationMinutes: number;
    category: string;
}

export const SERVICE_CATALOG: ServiceItem[] = [
    {name: '남성커트', durationMinutes: 30, category: '커트'},
    {name: '여성커트', durationMinutes: 30, category: '커트'},
    {name: '주니어커트', durationMinutes: 30, category: '커트'},

    {name: '남자 일반펌', durationMinutes: 90, category: '펌'},
    {name: '남자 디자인펌', durationMinutes: 90, category: '펌'},
    {name: '여자 일반펌', durationMinutes: 120, category: '펌'},
    {name: '여자 디자인펌', durationMinutes: 120, category: '펌'},
    {name: '셋팅펌', durationMinutes: 150, category: '펌'},

    {name: '남자 매직', durationMinutes: 120, category: '매직'},
    {name: '여자 매직', durationMinutes: 150, category: '매직'},
    {name: '매직셋팅', durationMinutes: 180, category: '매직'},
    {name: '볼륨매직', durationMinutes: 180, category: '매직'},

    {name: '다운펌+커트', durationMinutes: 90, category: '앞머리'},
    {name: '펌 롤', durationMinutes: 90, category: '앞머리'},
    {name: '펌 매직', durationMinutes: 90, category: '앞머리'},

    {name: '클리닉 3단계', durationMinutes: 60, category: '클리닉'},
    {name: '하오니코', durationMinutes: 60, category: '클리닉'},

    {name: '뿌리/전체(멋내기)', durationMinutes: 90, category: '염색'},
    {name: '뿌리/전체(새치)', durationMinutes: 90, category: '염색'},
];

export const SERVICE_COLOR_MAP: Record<string, string> = {
    '남성커트': '#4285F4',
    '여성커트': '#5B9BD5',
    '주니어커트': '#7CB9E8',

    '남자 일반펌': '#E53935',
    '남자 디자인펌': '#D81B60',
    '여자 일반펌': '#F06292',
    '여자 디자인펌': '#EC407A',
    '셋팅펌': '#AD1457',

    '남자 매직': '#43A047',
    '여자 매직': '#66BB6A',
    '매직셋팅': '#2E7D32',
    '볼륨매직': '#81C784',

    '다운펌+커트': '#7B1FA2',
    '펌 롤': '#9C27B0',
    '펌 매직': '#BA68C8',

    '클리닉 3단계': '#00897B',
    '하오니코': '#26A69A',

    '뿌리/전체(멋내기)': '#FF6D00',
    '뿌리/전체(새치)': '#F9A825',
};

const SERVICE_NAMES_BY_LENGTH = Object.keys(SERVICE_COLOR_MAP).sort((a, b) => b.length - a.length);

const FALLBACK_COLOR = '#999';

export function getServiceColor(service: string): string {
    const direct = SERVICE_COLOR_MAP[service];
    if (direct) return direct;

    for (const name of SERVICE_NAMES_BY_LENGTH) {
        if (service.includes(name)) return SERVICE_COLOR_MAP[name];
    }

    return FALLBACK_COLOR;
}

const catalogMap = new Map<string, ServiceItem>(
    SERVICE_CATALOG.map((s) => [s.name, s])
);

export function getGroupedCatalog(): Map<string, ServiceItem[]> {
    const grouped = new Map<string, ServiceItem[]>();

    for (const item of SERVICE_CATALOG) {
        const group = grouped.get(item.category);

        if (group) {
            group.push(item);
        } else {
            grouped.set(item.category, [item]);
        }
    }

    return grouped;
}

export function parseServiceString(str: string): string[] {
    if (!str.trim()) return [];
    return str.split('+').map((s) => s.trim()).filter(Boolean);
}

export function joinServiceNames(names: string[]): string {
    return names.join('+');
}

export function sumDurationMinutes(names: string[]): number {
    let total = 0;

    for (const name of names) {
        const item = catalogMap.get(name);

        if (item) {
            total += item.durationMinutes;
        }
    }

    return total;
}

export function calcEndTime(startTime: string, durationMinutes: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
    if (minutes <= 0) return '';

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h > 0 && m > 0) return `${h}시간${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
}
