let githubModulePromise = null;

async function getGithubRoutesLogic() {
  if (!githubModulePromise) {
    githubModulePromise = import('../../../backend/src/routes/github.js');
  }
  const mod = await githubModulePromise;
  return mod.default || mod;
}

// Esta função apenas redireciona para o fluxo OAuth do GitHub,
// reaproveitando a mesma lógica usada no backend local.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Em vez de montar um app Express completo, apenas replicamos
    // a lógica de redirecionamento chamando diretamente o handler
    const githubRoutes = await getGithubRoutesLogic();

    // githubRoutes é um Router; não conseguimos usá-lo diretamente aqui.
    // Então implementamos inline o mesmo comportamento do GET /auth/github
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CALLBACK_URL =
      process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback';

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      scope: 'read:user user:email',
      allow_signup: 'true',
    });

    return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  } catch (err) {
    console.error('Erro em /api/auth/github:', err);
    return res.status(500).json({ error: 'Erro ao iniciar login com GitHub' });
  }
}

