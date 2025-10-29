import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface Profile {
  id: string;
  name: string;
  major: string;
  email: string;
  phone: string;
  stnum: string;
  birthday: string;
  image_url?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: '사용자 정보를 가져올 수 없습니다.' };
      }

      const { data, error } = await supabase
        .from('profile')
        .select('id, name, major, email, phone, stnum, birthday, image_url')
        .eq('id', user.id)
        .single();

      if (error) {
        return { success: false, message: error.message };
      }

      if (data) {
        setProfile(data);
        return { success: true, data };
      }

      return { success: false, message: '프로필을 찾을 수 없습니다.' };
    } catch (err) {
      console.error('프로필 조회 오류:', err);
      return { success: false, message: '프로필 조회 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Omit<Profile, 'id'>>) => {
    if (!profile) {
      return { success: false, message: '프로필 정보가 없습니다.' };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile')
        .update(updates)
        .eq('id', profile.id);

      if (error) {
        return { success: false, message: error.message };
      }

      setProfile({ ...profile, ...updates });

      // Update localStorage
      if (updates.name) localStorage.setItem('user_name', updates.name);
      if (updates.major) localStorage.setItem('user_major', updates.major);
      if (updates.stnum) localStorage.setItem('user_stnum', updates.stnum);
      if (updates.image_url) localStorage.setItem('user_image_url', updates.image_url);

      return { success: true, message: '저장되었습니다!' };
    } catch (err) {
      console.error('프로필 업데이트 오류:', err);
      return { success: false, message: '프로필 업데이트 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const uploadImage = useCallback(async (file: File) => {
    if (!profile) {
      return { success: false, message: '프로필 정보가 없습니다.' };
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.stnum}_${Date.now()}.${fileExt}`;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: '사용자 정보를 가져올 수 없습니다.' };
      }

      // Delete old image if exists
      if (profile.image_url) {
        const urlParts = profile.image_url.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        await supabase.storage
          .from('profile-image')
          .remove([oldFileName]);
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('profile-image')
        .upload(fileName, file);

      if (uploadError) {
        return { success: false, message: '이미지 업로드 실패: ' + uploadError.message };
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profile-image')
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profile')
        .update({ image_url: imageUrl })
        .eq('id', profile.id);

      if (updateError) {
        return { success: false, message: '프로필 업데이트 실패: ' + updateError.message };
      }

      setProfile({ ...profile, image_url: imageUrl });
      localStorage.setItem('user_image_url', imageUrl);

      return { success: true, message: '이미지가 업로드되었습니다.', imageUrl };
    } catch (err) {
      console.error('이미지 업로드 오류:', err);
      return { success: false, message: '이미지 업로드 중 오류가 발생했습니다.' };
    } finally {
      setUploading(false);
    }
  }, [profile]);

  const refetchProfile = useCallback(() => {
    return fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    uploading,
    setProfile,
    fetchProfile,
    updateProfile,
    uploadImage,
    refetchProfile
  };
}
