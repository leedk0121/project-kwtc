// src/services/dobongCrawler.ts

const PROXY_URL = 'http://kwtc.dothome.co.kr/proxy.php';

interface DobongCrawlResult {
  success: boolean;
  data?: any;
  error?: string;
  server?: string;
  timestamp?: string;
}

// HTML 파싱하여 예약 가능 시간대 추출
function parseAvailableSlots(htmlString: string): Array<{
  time: string;
  available: boolean;
  price?: string;
}> {
  const slots: Array<{ time: string; available: boolean; price?: string }> = [];
  
  // checkbox가 있고 disabled가 아닌 경우 = 예약 가능
  // disabled가 있거나 nochk 클래스가 있는 경우 = 예약 불가
  
  const timeRegex = /(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/g;
  const matches = [...htmlString.matchAll(timeRegex)];
  
  // 간단한 파싱: checkbox가 있고 disabled가 없으면 예약 가능
  const availableRegex = /<input type=['"]checkbox['"]/g;
  const disabledRegex = /disabled/g;
  
  matches.forEach((match) => {
    const time = `${match[1]}~${match[2]}`;
    // 해당 시간대 섹션에 checkbox가 있는지 확인
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
    console.log(`📡 도봉구 크롤링 시작: ${dateStr}`);
    
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
      console.log('✅ 도봉구 크롤링 성공');
      
      // play_name 파싱
      if (result.data?.play_name) {
        const playData = JSON.parse(result.data.play_name);
        console.log(`📊 ${playData.length}개 코트 데이터 수신`);
        
        // 각 코트별 예약 가능 시간대 추출
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

// 헬스체크
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