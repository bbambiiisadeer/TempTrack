const normalizeToChristianEra = (dateStr: string): string => {
  const match = dateStr.match(/^(\d{4})/);
  if (match) {
    const year = parseInt(match[1]);
    if (year > 2500) {
      return dateStr.replace(/^(\d{4})/, String(year - 543));
    }
  }
  return dateStr;
};

export const getComparisonTimestamp = (dateStr: string | undefined): number => {
  if (!dateStr) return 0;
  
  const normalized = normalizeToChristianEra(dateStr);
  
  let cleanStr = normalized.trim().replace("Z", "").replace("T", " ").split(".")[0];
  const match = cleanStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})[\s](\d{1,2}):(\d{1,2}):(\d{1,2})/);
  
  if (match) {
    let [_, y, m, d, h, min, s] = match;
    let year = parseInt(y);
    return new Date(year, parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min), parseInt(s)).getTime();
  }
  
  return new Date(normalized).getTime();
};

export const filterSensorHistory = (
  sensorHistory: Array<{temp: number; timestamp: string}>,
  parcel: {
    trackingNo: string;
    shippedAt?: string;
    deliveredAt?: string;
    isDelivered?: boolean;
  }
): Array<{temp: number; timestamp: string}> => {
  
  if (!parcel.shippedAt) return [];
  
  const history = sensorHistory || [];
  const shippedTime = getComparisonTimestamp(parcel.shippedAt);
  const deliveredTime = parcel.deliveredAt 
    ? getComparisonTimestamp(parcel.deliveredAt) 
    : Infinity;

  return [...history]
    .filter(data => {
      const sensorTime = getComparisonTimestamp(data.timestamp);
      return sensorTime >= shippedTime && sensorTime <= deliveredTime;
    })
    .sort((a, b) => 
      getComparisonTimestamp(b.timestamp) - getComparisonTimestamp(a.timestamp)
    );
};