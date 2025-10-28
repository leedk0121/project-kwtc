// src/services/dobongCrawler.ts

const PROXY_URL = 'http://kwtc.dothome.co.kr/proxy.php';

interface DobongCrawlResult {
  success: boolean;
  data?: any;
  error?: string;
  server?: string;
  timestamp?: string;
}

function parseAvailableSlots(htmlString: string): Array<{
  time: string;
  available: boolean;
  price?: string;
}> {
  const slots: Array<{ time: string; available: boolean; price?: string }> = [];
  const timeRegex = /(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/g;
  const matches = [...htmlString.matchAll(timeRegex)];
  const availableRegex = /<input type=['"]checkbox['"]/g;
  const disabledRegex = /disabled/g;
  
  matches.forEach((match) => {
    const time = `${match[1]}~${match[2]}`;
    const section = htmlString.substring(match.index! - 500, match.index! + 500);
    const hasCheckbox = availableRegex.test(section);
    const isDisabled = disabledRegex.test(section);
    
    slots.push({
      time,
      available: hasCheckbox && !isDisabled,
    });
  });
  
  return slots;
}

export async function crawlDobong(
  username: string,
  password: string,
  dateStr: string
): Promise<DobongCrawlResult> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'crawl_dobong',
        username,
        password,
        dateStr
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: DobongCrawlResult = await response.json();

    if (result.success) {
      if (result.data?.play_name) {
        const playData = JSON.parse(result.data.play_name);

        const courtAvailability = playData.map((court: any) => ({
          courtName: court.play_name,
          playCode: court.play_code,
          placeCode: court.place_code,
          availableSlots: parseAvailableSlots(court.htmlx || ''),
          totalSlots: parseInt(court.total_cnt || '0')
        }));
        
        return {
          ...result,
          data: {
            ...result.data,
            courts: courtAvailability
          }
        };
      }
      
      return result;
    } else {
      console.error('❌ 도봉구 크롤링 실패:', result.error);
      throw new Error(result.error || '크롤링 실패');
    }
  } catch (error: any) {
    console.error('❌ 도봉구 크롤링 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function checkProxyHealth(): Promise<boolean> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'health'
      })
    });

    const result = await response.json();
    return result.status === 'ok';
  } catch (error) {
    console.error('프록시 헬스체크 실패:', error);
    return false;
  }
}