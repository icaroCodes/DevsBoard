import supabase from '../database/connection.js';
import { generateUniqueUsername } from './usernames.js';

export const resolveOAuthLogin = async ({
  provider,
  providerId,
  email,
  name,
  avatarUrl,
}) => {
  // 1. Exact provider match in auth_accounts
  const { data: identity } = await supabase
    .from('auth_accounts')
    .select('user_id')
    .eq('provider_account_id', String(providerId))
    .maybeSingle();

  if (identity) {
    return { kind: 'login', userId: identity.user_id };
  }

  // 2. Email match in users
  const lowered = email.toLowerCase();
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .ilike('email', lowered)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingUser) {
    // Link automatically since OAuth emails are verified
    const { error: linkErr } = await supabase
      .from('auth_accounts')
      .insert({
        user_id: existingUser.id,
        provider,
        provider_account_id: String(providerId),
      });
    if (linkErr) throw linkErr;
    return { kind: 'login', userId: existingUser.id };
  }

  // 3. Brand new user
  const newUsername = await generateUniqueUsername({ name: name || null, email });

  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      username: newUsername,
      display_name: name || null,
      avatar_url: avatarUrl || null,
    })
    .select('id')
    .single();

  if (userError) throw userError;

  const { error: identityError } = await supabase
    .from('auth_accounts')
    .insert({
      user_id: newUser.id,
      provider,
      provider_account_id: String(providerId),
    });

  if (identityError) {
    await supabase.from('users').delete().eq('id', newUser.id);
    throw identityError;
  }

  return { kind: 'created', userId: newUser.id };
};
