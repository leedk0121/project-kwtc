import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../Auth/supabaseClient';
import type { Post } from '../Posttypes';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const sortPosts = useCallback((postsData: Post[]) => {
    return postsData.sort((a, b) => {
      // 공지사항을 맨 위로
      if (a.post_type === 'announcement' && b.post_type !== 'announcement') {
        return -1;
      }
      if (a.post_type !== 'announcement' && b.post_type === 'announcement') {
        return 1;
      }
      // 같은 타입이면 최신순으로 정렬
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, title, content, created_at, post_type, user_name, image_urls')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const sortedPosts = sortPosts(data);
        setPosts(sortedPosts);
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('게시글 조회 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [sortPosts]);

  const searchPosts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return fetchPosts();
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, title, content, created_at, post_type, user_name, image_urls')
        .ilike('title', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const sortedPosts = sortPosts(data);
        setPosts(sortedPosts);
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('게시글 검색 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [sortPosts, fetchPosts]);

  const fetchPostById = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, title, content, created_at, post_type, user_name, image_urls')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('게시글 조회 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadImages = useCallback(async (files: File[]) => {
    const imageUrls: string[] = [];

    setUploading(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (error) throw error;

        const publicUrl = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName).data.publicUrl;

        imageUrls.push(publicUrl);
      }

      return { success: true, imageUrls };
    } catch (error: any) {
      console.error('이미지 업로드 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setUploading(false);
    }
  }, []);

  const createPost = useCallback(async (
    title: string,
    content: string,
    postType: string,
    imageFiles: File[] = []
  ) => {
    if (!title.trim() || !content.trim()) {
      return { success: false, message: '제목과 내용을 모두 입력해주세요.' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: '로그인이 필요합니다.' };
      }

      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const uploadResult = await uploadImages(imageFiles);
        if (!uploadResult.success) {
          return { success: false, message: uploadResult.message || '이미지 업로드 실패' };
        }
        imageUrls = uploadResult.imageUrls || [];
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title,
        content,
        post_type: postType,
        image_urls: imageUrls,
      });

      if (error) throw error;

      // Refresh posts after creating
      await fetchPosts();

      return { success: true, message: '게시글 등록 완료!' };
    } catch (error: any) {
      console.error('게시글 작성 오류:', error);
      return { success: false, message: error.message };
    }
  }, [uploadImages, fetchPosts]);

  const deletePost = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh posts after deleting
      await fetchPosts();

      return { success: true, message: '게시글이 삭제되었습니다.' };
    } catch (error: any) {
      console.error('게시글 삭제 오류:', error);
      return { success: false, message: error.message };
    }
  }, [fetchPosts]);

  return {
    posts,
    setPosts,
    loading,
    uploading,
    fetchPosts,
    searchPosts,
    fetchPostById,
    uploadImages,
    createPost,
    deletePost
  };
}
