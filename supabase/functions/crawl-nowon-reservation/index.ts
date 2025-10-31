// supabase/functions/crawl-nowon-reservations/index.ts
// 노원구 예약 페이지 크롤러 (Edge Function 버전)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_URL = "https://reservation.nowonsc.kr";

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 쿠키 관리 클래스
class CookieManager {
  private cookies: Map<string, string> = new Map();

  saveCookies(headers: Headers) {
    const cookieStrings = headers.getSetCookie?.() || [];
    
    cookieStrings.forEach(cookieStr => {
      const [cookiePart] = cookieStr.split(';');
      const [name, value] = cookiePart.split('=');
      if (name && value) {
        this.cookies.set(name.trim(), value.trim());
      }
    });

    const setCookieHeader = headers.get('set-cookie');
    if (setCookieHeader) {
      const [cookiePart] = setCookieHeader.split(';');
      const [name, value] = cookiePart.split('=');
      if (name && value) {
        this.cookies.set(name.trim(), value.trim());
      }
    }
  }

  getCookieString(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  hasCookie(name: string): boolean {
    return this.cookies.has(name);
  }
}

async function loginNowon(username: string, password: string): Promise<{ cookies: string, html: string } | null> {
  try {
    const cookieManager = new CookieManager();

    // 1단계: 로그인 페이지 접속 (초기 쿠키 받기)
    const loginPageRes = await fetch(`${BASE_URL}/member/login`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    cookieManager.saveCookies(loginPageRes.headers);

    // 2단계: 로그인 폼 제출
    const formData = new URLSearchParams();
    formData.append('memberId', username);
    formData.append('memberPassword', password);
    formData.append('save_id', 'on');
    formData.append('url', '/');

    const loginRes = await fetch(`${BASE_URL}/member/loginAction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieManager.getCookieString(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/member/login`
      },
      body: formData.toString(),
      redirect: 'manual'
    });

    cookieManager.saveCookies(loginRes.headers);

    // 리다이렉트 처리
    if (loginRes.status === 302 || loginRes.status === 301 || loginRes.status === 303) {
      const location = loginRes.headers.get('location');

      if (location) {
        const redirectUrl = location.startsWith('http') ? location : `${BASE_URL}${location}`;
        
        const redirectRes = await fetch(redirectUrl, {
          method: 'GET',
          headers: {
            'Cookie': cookieManager.getCookieString(),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow'
        });

        cookieManager.saveCookies(redirectRes.headers);
      }
    }

    // 3단계: 마이페이지 접근 - HTML 가져오기
    const testRes = await fetch(`${BASE_URL}/mypage/apply_list`, {
      method: 'GET',
      headers: {
        'Cookie': cookieManager.getCookieString(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow'
    });

    cookieManager.saveCookies(testRes.headers);

    const testHtml = await testRes.text();

    // 로그인 성공 확인
    const isLoginPage = testRes.url.includes('login') || testHtml.includes('mb_id') || testHtml.includes('member/login');
    const hasMypage = testHtml.includes('신청내역') || testHtml.includes('마이페이지');

    if (isLoginPage || !hasMypage) {
      console.error('로그인 실패 - 세션 미확립');
      return null;
    }

    console.log('노원구 로그인 성공');
    return {
      cookies: cookieManager.getCookieString(),
      html: testHtml
    };

  } catch (error) {
    console.error('로그인 중 오류:', error);
    return null;
  }
}

serve(async (req) => {
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 요청에서 JWT 토큰 추출하여 사용자 ID 가져오기
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Authorization 헤더 없음");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("사용자 인증 실패:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;

    // 로그인 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from("tennis_reservation_profile")
      .select("nowon_id, nowon_pass")
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error("프로필 조회 오류:", profileError);
      return new Response(JSON.stringify({
        error: "Database error",
        details: profileError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!profile || !profile.nowon_id || !profile.nowon_pass) {
      console.error("프로필 정보 없음");
      return new Response(JSON.stringify({
        error: "Profile not found - please register your Nowon account in profile page"
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { nowon_id, nowon_pass } = profile;

    // 노원구 로그인
    const loginResult = await loginNowon(nowon_id, nowon_pass);

    if (!loginResult) {
      console.error("로그인 실패");
      return new Response(JSON.stringify({
        error: "Login failed - please check your credentials"
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { cookies, html } = loginResult;

    // API로 예약 데이터 가져오기
    const apiPayload = new URLSearchParams({
      cp: '1',
      rn: '100',
      op: '0',
      startDate: '',
      endDate: ''
    });

    const apiRes = await fetch(`${BASE_URL}/mypage/ApplyListApi`, {
      method: 'POST',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `${BASE_URL}/mypage/apply_list`
      },
      body: apiPayload.toString()
    });

    if (!apiRes.ok) {
      console.error("API 호출 실패:", apiRes.status);
      const errorText = await apiRes.text();
      console.error("에러 응답:", errorText.substring(0, 500));
      throw new Error(`API call failed: ${apiRes.status}`);
    }

    const apiData = await apiRes.json();

    // API 응답 구조 파싱
    let rawList = [];
    
    if (Array.isArray(apiData)) {
      rawList = apiData;
    } else if (apiData.list) {
      rawList = apiData.list;
    } else if (apiData.data) {
      rawList = apiData.data;
    } else if (apiData.resultList) {
      rawList = apiData.resultList;
    } else if (apiData.applyList) {
      rawList = apiData.applyList;
    }

    // 데이터 변환 - 모든 항목 포함
    const dataList = rawList.map((item: any, index: number) => {
      return {
        no: item.seq || item.no || item.applyNo || index + 1,
        apply_date: item.insertDate || '',
        reservation_date: '',
        reservation_time: '',
        facility: item.cName || '',
        location: '',
        payment_amount: String(item.priceRefundTotalPricePay || 0),
        payment_status: item.pstat || '',
        payment_method: item.payMethod || '',
        cancel_status: item.rstat === 'C' ? '취소' : '-',
        raw: item
      };
    });

    // Storage에 저장
    const storageData = {
      userId: userId,
      timestamp: new Date().toISOString(),
      reservations: dataList,
      count: dataList.length
    };

    try {
      const fileName = `nowon-reservations-${userId}.json`;
      const fileContent = JSON.stringify(storageData, null, 2);
      const blob = new Blob([fileContent], { type: 'application/json' });

      const { error: uploadError } = await supabase.storage
        .from('reservation-data')
        .upload(fileName, blob, {
          contentType: 'application/json',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Storage 업로드 오류:', uploadError);
        throw uploadError;
      }

      console.log('Storage 저장 완료:', fileName);

    } catch (storageError: any) {
      console.error('Storage 저장 오류:', storageError.message);
      // Storage 실패해도 응답은 반환
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: dataList.length > 0 ? "Crawling completed successfully" : "No reservations found",
      count: dataList.length,
      userId: userId,
      data: dataList
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error("실행 중 오류:", err.message);
    console.error("스택:", err.stack);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: err.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});