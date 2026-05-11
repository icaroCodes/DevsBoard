import supabase from '../database/connection.js';
import { generateUniqueUsername } from './usernames.js';

export const resolveOAuthLogin = async ({
  provider,
  providerId,
  email,
  name,
  avatarUrl,
}) => {
  // 1. Exact provider match in auth_accounts — returning user
  const { data: identity } = await supabase
    .from('auth_accounts')
    .select('user_id')
    .eq('provider', provider)
    .eq('provider_account_id', String(providerId))
    .maybeSingle();

  if (identity) {
    return { kind: 'login', userId: identity.user_id };
  }

  // 2. Brand new user — each provider creates a separate account,
  //    even if the email is the same as another provider's account.
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
