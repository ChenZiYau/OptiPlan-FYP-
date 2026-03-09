import { supabase } from './supabase';

// Helper to generate 6 digit alphanumeric code for groups
function generateGroupCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ── Users & Friends ──────────────────────────────────────────────

export async function addFriendByUid(myUid: string, friendUid: string) {
  if (myUid === friendUid) throw new Error('Cannot add yourself as a friend.');

  // Check if user exists
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('uid')
    .eq('uid', friendUid)
    .single();

  if (userError || !user) {
    throw new Error('User not found.');
  }

  // Check if already friends or pending
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(user_id.eq.${myUid},friend_id.eq.${friendUid}),and(user_id.eq.${friendUid},friend_id.eq.${myUid})`)
    .limit(1);

  if (existing && existing.length > 0) {
    if (existing[0].status === 'accepted') throw new Error('Already friends.');
    throw new Error('Friend request already pending.');
  }

  // Insert pending friend request
  const { error: insertError } = await supabase
    .from('friendships')
    .insert([{ user_id: myUid, friend_id: friendUid, status: 'pending' }]);

  if (insertError) {
    if (insertError.code === '23505') throw new Error('Friend request already sent.');
    throw insertError;
  }

  return true;
}

export async function getFriends(myUid: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      friend_id,
      nickname,
      note,
      users!friendships_friend_id_fkey (
        uid,
        username
      )
    `)
    .eq('user_id', myUid)
    .eq('status', 'accepted');

  if (error) throw error;

  return data.map((d: any) => ({
    uid: d.users.uid,
    username: d.users.username,
    nickname: d.nickname || null,
    note: d.note || null,
  }));
}

export async function getPendingRequests(myUid: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      user_id,
      created_at,
      users!friendships_user_id_fkey (
        uid,
        username
      )
    `)
    .eq('friend_id', myUid)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((d: any) => ({
    id: d.id,
    uid: d.users.uid,
    username: d.users.username,
    created_at: d.created_at,
  }));
}

export async function getSentRequests(myUid: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      friend_id,
      created_at,
      users!friendships_friend_id_fkey (
        uid,
        username
      )
    `)
    .eq('user_id', myUid)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((d: any) => ({
    id: d.id,
    uid: d.users.uid,
    username: d.users.username,
    created_at: d.created_at,
  }));
}

export async function acceptFriendRequest(requestId: string, myUid: string) {
  // Get the request details
  const { data: req, error: fetchError } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .eq('id', requestId)
    .eq('friend_id', myUid)
    .eq('status', 'pending')
    .single();

  if (fetchError || !req) throw new Error('Friend request not found.');

  // Update original row to accepted
  const { error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // Insert reverse row so both users see each other
  await supabase
    .from('friendships')
    .insert([{ user_id: myUid, friend_id: req.user_id, status: 'accepted' }])
    .select();

  return true;
}

export async function declineFriendRequest(requestId: string, myUid: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId)
    .eq('friend_id', myUid)
    .eq('status', 'pending');

  if (error) throw error;
  return true;
}

export async function removeFriend(myUid: string, friendUid: string) {
  // Delete both directions
  const { error: e1 } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', myUid)
    .eq('friend_id', friendUid);

  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', friendUid)
    .eq('friend_id', myUid);

  if (e2) throw e2;
  return true;
}

export async function updateFriendNickname(myUid: string, friendUid: string, nickname: string | null) {
  const { error } = await supabase
    .from('friendships')
    .update({ nickname: nickname || null })
    .eq('user_id', myUid)
    .eq('friend_id', friendUid)
    .eq('status', 'accepted');

  if (error) throw error;
  return true;
}

export async function updateFriendNote(myUid: string, friendUid: string, note: string | null) {
  const { error } = await supabase
    .from('friendships')
    .update({ note: note || null })
    .eq('user_id', myUid)
    .eq('friend_id', friendUid)
    .eq('status', 'accepted');

  if (error) throw error;
  return true;
}

// ── Groups ───────────────────────────────────────────────────────

export async function createGroup(name: string, userId: string) {
  const inviteCode = generateGroupCode();

  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert([{ name, invite_code: inviteCode }])
    .select()
    .single();

  if (groupError) throw groupError;

  // Add creator to group
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([{ group_id: group.id, user_id: userId }]);

  if (memberError) throw memberError;

  return group;
}

export async function joinGroupByCode(code: string, userId: string) {
  const upperCode = code.toUpperCase();

  // Find group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', upperCode)
    .single();

  if (groupError || !group) throw new Error('Invalid invite code.');

  // Insert into group_members
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([{ group_id: group.id, user_id: userId }]);

  if (memberError) {
    if (memberError.code === '23505') throw new Error('Already a member of this group.');
    throw memberError;
  }

  return group;
}

export async function getUserGroups(userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups (
        id,
        name,
        invite_code
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;

  return data.map((d: any) => d.groups);
}

export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      users (
        uid,
        username
      )
    `)
    .eq('group_id', groupId);

  if (error) throw error;

  return data.map((d: any) => ({
    uid: d.users.uid,
    username: d.users.username,
  }));
}


// ── Chat ─────────────────────────────────────────────────────────

export async function getGroupMessages(groupId: string) {
  const { data, error } = await supabase
    .from('group_messages')
    .select(`
      id,
      content,
      created_at,
      sender_id,
      users (
        username
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data.map((d: any) => ({
    id: d.id,
    content: d.content,
    created_at: d.created_at,
    sender_id: d.sender_id,
    sender_username: d.users?.username || 'Unknown User',
  }));
}

export async function sendGroupMessage(groupId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from('group_messages')
    .insert([{ group_id: groupId, sender_id: senderId, content }])
    .select(`
      id,
      content,
      created_at,
      sender_id,
      users (
        username
      )
    `)
    .single();

  if (error) throw error;

  const usersArray = data.users as any;
  const username = Array.isArray(usersArray) ? usersArray[0]?.username : usersArray?.username;

  return {
    id: data.id,
    content: data.content,
    created_at: data.created_at,
    sender_id: data.sender_id,
    sender_username: username || 'Unknown User',
  };
}

export const UNSENT_MARKER = '__UNSENT__';

export async function unsendGroupMessage(messageId: string, groupId: string, senderId: string) {
  // RLS prevents UPDATE/DELETE on group_messages. We use an append-only tombstone pattern.
  const { error } = await supabase
    .from('group_messages')
    .insert([{
      group_id: groupId,
      sender_id: senderId,
      content: `${UNSENT_MARKER}:${messageId}`
    }])
    .select();

  if (error) throw error;
  return true;
}

// ── Resources ────────────────────────────────────────────────────

export async function getGroupLinks(groupId: string) {
  const { data, error } = await supabase
    .from('group_links')
    .select(`
      id,
      url,
      title,
      created_at,
      added_by,
      users (
        username
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((d: any) => ({
    ...d,
    added_by_username: d.users?.username || 'Unknown User'
  }));
}

export async function addGroupLink(groupId: string, addedBy: string, url: string, title: string) {
  const { data, error } = await supabase
    .from('group_links')
    .insert([{ group_id: groupId, added_by: addedBy, url, title }])
    .select(`
      id,
      url,
      title,
      created_at,
      added_by,
      users (
        username
      )
    `)
    .single();

  if (error) throw error;

  const usersArray = data.users as any;
  const username = Array.isArray(usersArray) ? usersArray[0]?.username : usersArray?.username;

  return {
    ...data,
    added_by_username: username || 'Unknown User'
  };
}

export async function getGroupFiles(groupId: string) {
  const { data, error } = await supabase
    .from('group_files')
    .select(`
      id,
      file_url,
      file_name,
      file_type,
      uploaded_at,
      uploaded_by,
      users (
        username
      )
    `)
    .eq('group_id', groupId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data.map((d: any) => ({
    ...d,
    uploaded_by_username: d.users?.username || 'Unknown User'
  }));
}

export async function uploadGroupFile(groupId: string, uploadedBy: string, file: File) {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only PDF, Word, and PowerPoint files are allowed.');
  }

  // Upload to Supabase Storage (assuming a 'group_files' bucket exists)
  const ext = file.name.split('.').pop() || '';
  const filePath = `${groupId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('group_files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('group_files')
    .getPublicUrl(filePath);

  const fileUrl = urlData.publicUrl;

  // Insert DB record
  const { data, error: insertError } = await supabase
    .from('group_files')
    .insert([{
      group_id: groupId,
      uploaded_by: uploadedBy,
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type
    }])
    .select(`
      id,
      file_url,
      file_name,
      file_type,
      uploaded_at,
      uploaded_by,
      users (
        username
      )
    `)
    .single();

  if (insertError) throw insertError;

  const usersArray = data.users as any;
  const username = Array.isArray(usersArray) ? usersArray[0]?.username : usersArray?.username;

  return {
    ...data,
    uploaded_by_username: username || 'Unknown User'
  };
}

// ── Group Tasks (Kanban) ────────────────────────────────────

export async function getGroupTasks(groupId: string) {
  const { data, error } = await supabase
    .from('group_tasks')
    .select(`
      id,
      group_id,
      created_by,
      assigned_to,
      title,
      description,
      status,
      created_at,
      creator:users!group_tasks_created_by_fkey ( uid, username ),
      assignee:users!group_tasks_assigned_to_fkey ( uid, username )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data.map((d: any) => ({
    id: d.id,
    groupId: d.group_id,
    createdBy: d.created_by,
    assignedTo: d.assigned_to,
    title: d.title,
    description: d.description || '',
    status: d.status as 'todo' | 'doing' | 'done' | 'archived',
    createdAt: d.created_at,
    creatorUsername: d.creator?.username || 'Unknown',
    assigneeUsername: d.assignee?.username || null,
  }));
}

export async function createGroupTask(
  groupId: string,
  createdBy: string,
  title: string,
  description?: string,
  assignedTo?: string
) {
  const { data, error } = await supabase
    .from('group_tasks')
    .insert([{
      group_id: groupId,
      created_by: createdBy,
      assigned_to: assignedTo || createdBy,
      title,
      description: description || null,
      status: 'todo',
    }])
    .select(`
      id,
      group_id,
      created_by,
      assigned_to,
      title,
      description,
      status,
      created_at,
      creator:users!group_tasks_created_by_fkey ( uid, username ),
      assignee:users!group_tasks_assigned_to_fkey ( uid, username )
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    groupId: data.group_id,
    createdBy: data.created_by,
    assignedTo: data.assigned_to,
    title: data.title,
    description: data.description || '',
    status: data.status as 'todo' | 'doing' | 'done' | 'archived',
    createdAt: data.created_at,
    creatorUsername: (data as any).creator?.username || 'Unknown',
    assigneeUsername: (data as any).assignee?.username || null,
  };
}

export async function updateGroupTask(
  taskId: string,
  updates: { status?: string; title?: string; description?: string; assigned_to?: string }
) {
  const payload: Record<string, unknown> = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description || null;
  if (updates.assigned_to !== undefined) payload.assigned_to = updates.assigned_to || null;

  const { error } = await supabase
    .from('group_tasks')
    .update(payload)
    .eq('id', taskId);

  if (error) throw error;
  return true;
}

export async function deleteGroupTask(taskId: string) {
  const { error } = await supabase
    .from('group_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
  return true;
}

// ── Schedule Matcher ────────────────────────────────────────

export interface GroupMemberSchedule {
  groupId: string;
  userId: string;
  weekOffset: number;
  day: string;
  hour: number;
  status: 'free' | 'busy';
}

export async function getGroupSchedules(groupId: string, weekOffset: number = 0): Promise<GroupMemberSchedule[]> {
  const { data, error } = await supabase
    .from('group_member_schedules')
    .select('group_id, user_id, week_offset, day, hour, status')
    .eq('group_id', groupId)
    .eq('week_offset', weekOffset);

  if (error) throw error;

  return (data || []).map(d => ({
    groupId: d.group_id,
    userId: d.user_id,
    weekOffset: d.week_offset,
    day: d.day,
    hour: d.hour,
    status: d.status as 'free' | 'busy',
  }));
}

export async function upsertUserSchedule(
  groupId: string,
  userId: string,
  weekOffset: number,
  day: string,
  hour: number,
  status: 'free' | 'busy'
) {
  const { error } = await supabase
    .from('group_member_schedules')
    .upsert(
      {
        group_id: groupId,
        user_id: userId,
        week_offset: weekOffset,
        day,
        hour,
        status,
      },
      { onConflict: 'group_id,user_id,week_offset,day,hour' }
    );

  if (error) {
    console.error('upsertUserSchedule error:', error);
    throw error;
  }
  return true;
}
