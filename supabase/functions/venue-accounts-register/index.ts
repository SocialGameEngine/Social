import { createHandler, corsResponse, AppError } from '../_shared/utils.ts';

async function handleVenueAccountRegister(req: Request, uid: string, supabase: any): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const inputFullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const inputPhone = typeof body?.phone === 'string' ? body.phone.trim() : '';

  const { data: existingAccount, error: existingError } = await supabase
    .from('venue_accounts')
    .select('id, phone')
    .eq('auth_user_id', uid)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('Failed to fetch venue account', existingError);
    throw new AppError(500, 'Unable to load venue account', 'venue-account-query');
  }

  const { data: userResult, error: adminError } = await supabase.auth.admin.getUserById(uid);
  if (adminError || !userResult?.user) {
    console.error('Failed to load auth user info', adminError);
    throw new AppError(500, 'Unable to load user profile', 'auth-user-missing');
  }

  const email = userResult.user.email;
  if (!email) {
    throw new AppError(400, 'Venue accounts require an email address', 'email-required');
  }

  const normalizedName =
    inputFullName ||
    userResult.user.user_metadata?.full_name ||
    userResult.user.user_metadata?.display_name ||
    email;
  const normalizedPhone = inputPhone || existingAccount?.phone || null;

  if (existingAccount?.id) {
    const { error: updateError } = await supabase
      .from('venue_accounts')
      .update({
        email,
        full_name: normalizedName,
        phone: normalizedPhone,
        is_active: true,
      })
      .eq('id', existingAccount.id);

    if (updateError) {
      console.error('Failed to update venue account', updateError);
      throw new AppError(500, 'Unable to update venue account', 'venue-account-update');
    }
  } else {
    const { error: insertError } = await supabase
      .from('venue_accounts')
      .insert({
        auth_user_id: uid,
        email,
        full_name: normalizedName,
        phone: normalizedPhone,
        role: 'bar_owner',
        is_active: true,
      });

    if (insertError) {
      console.error('Failed to create venue account', insertError);
      throw new AppError(500, 'Unable to create venue account', 'venue-account-create');
    }
  }

  // Fetch the final venue account to return
  const { data: finalAccount, error: fetchError } = await supabase
    .from('venue_accounts')
    .select('*')
    .eq('auth_user_id', uid)
    .single();

  if (fetchError || !finalAccount) {
    console.error('Failed to fetch final venue account', fetchError);
    throw new AppError(500, 'Unable to retrieve venue account', 'venue-account-fetch');
  }

  return corsResponse({ 
    success: true, 
    venueAccount: finalAccount 
  });
}

Deno.serve(createHandler(handleVenueAccountRegister));
