export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  post_type: string;
    user_name: string;
    image_urls: string[]; // 이미지 URL 배열
}