// @ts-nocheck

// ============================================
// 1. CONFIGURATION SUPABASE
// ============================================
const SUPABASE_URL = 'https://zgysmnkbguxkdulmttif.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_p4ZzCnyDZf2Izbvjt9NIIg_Wxu3sgOO';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// 2. RÉFÉRENCES DOM
// ============================================
const form = document.getElementById('product-form');
const formSection = document.getElementById('form-section');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const productIdInput = document.getElementById('product-id');
const nameInput = document.getElementById('name');
const descInput = document.getElementById('description');
const priceInput = document.getElementById('price');
const imageFileInput = document.getElementById('image_file');
const imagePreview = document.getElementById('image-preview');
const container = document.getElementById('products-container');
const countSpan = document.getElementById('product-count');

// Auth DOM
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const authButtons = document.getElementById('auth-buttons');
const showLoginBtn = document.getElementById('show-login-btn');
const authModal = document.getElementById('auth-modal');
const closeModal = document.getElementById('close-modal');
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchLink = document.getElementById('auth-switch-link');

// État global
let currentUser = null;
let currentImageUrl = null;
let isSignUpMode = false;

// ============================================
// 3. GESTION DE L'AUTHENTIFICATION
// ============================================

// Écouter les changements d'état de connexion
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    currentUser = session.user;
    // Mettre à jour l'interface
    userInfo.style.display = 'flex';
    authButtons.style.display = 'none';
    formSection.style.display = 'block';
    userEmail.textContent = currentUser.email;
  } else {
    currentUser = null;
    userInfo.style.display = 'none';
    authButtons.style.display = 'block';
    formSection.style.display = 'none';
    resetForm();
  }
  loadProducts(); // Recharger les produits pour mettre à jour les boutons
});

// Ouvrir la modale
showLoginBtn.addEventListener('click', () => {
  authModal.style.display = 'flex';
  isSignUpMode = false;
  updateAuthUI();
});

// Fermer la modale
closeModal.addEventListener('click', () => {
  authModal.style.display = 'none';
  authForm.reset();
});

// Basculer entre Connexion et Inscription
authSwitchLink.addEventListener('click', (e) => {
  e.preventDefault();
  isSignUpMode = !isSignUpMode;
  updateAuthUI();
});

function updateAuthUI() {
  if (isSignUpMode) {
    authTitle.textContent = 'Inscription';
    authSubmitBtn.textContent = 'Créer mon compte';
    authSwitchText.textContent = 'Déjà un compte ?';
    authSwitchLink.textContent = 'Se connecter';
  } else {
    authTitle.textContent = 'Connexion';
    authSubmitBtn.textContent = 'Se connecter';
    authSwitchText.textContent = 'Pas encore de compte ?';
    authSwitchLink.textContent = 'Créer un compte';
  }
}

// Soumission du formulaire d'authentification
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value;

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = 'Traitement...';

  try {
    if (isSignUpMode) {
      // Inscription
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      showToast('Inscription réussie ! Vous êtes connecté.', 'success');
    } else {
      // Connexion
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Connexion réussie !', 'success');
    }
    authModal.style.display = 'none';
    authForm.reset();
  } catch (err) {
    console.error('Erreur auth:', err);
    showToast(err.message || 'Erreur d\'authentification', 'error');
  } finally {
    authSubmitBtn.disabled = false;
    updateAuthUI();
  }
});

// Déconnexion
logoutBtn.addEventListener('click', async () => {
  if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
  await supabaseClient.auth.signOut();
  showToast('Déconnecté avec succès.');
});

// ============================================
// 4. FONCTIONS UTILITAIRES
// ============================================
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function resetForm() {
  form.reset();
  productIdInput.value = '';
  currentImageUrl = null;
  formTitle.textContent = 'Nouveau produit';
  submitBtn.textContent = 'Publier';
  cancelBtn.style.display = 'none';
  imagePreview.style.display = 'none';
  imagePreview.src = '';
}

function fillFormForEdit(product) {
  productIdInput.value = product.id;
  nameInput.value = product.name;
  descInput.value = product.description || '';
  priceInput.value = product.price;
  currentImageUrl = product.image_url || null;

  if (currentImageUrl) {
    imagePreview.src = currentImageUrl;
    imagePreview.style.display = 'block';
  } else {
    imagePreview.style.display = 'none';
    imagePreview.src = '';
  }

  imageFileInput.value = '';
  formTitle.textContent = 'Modifier le produit';
  submitBtn.textContent = 'Enregistrer';
  cancelBtn.style.display = 'inline-block';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

imageFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

async function uploadImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabaseClient.storage
    .from('product-images')
    .upload(filePath, file);

  if (error) throw error;

  const { data: urlData } = supabaseClient.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// ============================================
// 5. LECTURE (READ)
// ============================================
async function loadProducts() {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    renderProducts(data || []);
  } catch (err) {
    console.error('Erreur chargement:', err);
    container.innerHTML = '<p class="empty">Erreur de chargement des produits.</p>';
    showToast('Impossible de charger les produits', 'error');
  }
}

function renderProducts(products) {
  countSpan.textContent = products.length;

  if (products.length === 0) {
    container.innerHTML = '<p class="empty">Aucun produit pour l\'instant. Connectez-vous pour publier le premier.</p>';
    return;
  }

  container.innerHTML = products.map(product => {
    const isOwner = currentUser && product.user_id === currentUser.id;
    const name = escapeHtml(product.name);

    return `
      <article class="card">
        <div class="card-media">
          ${product.image_url
            ? `<img src="${escapeHtml(product.image_url)}" alt="${name}" loading="lazy" onerror="this.remove()">`
            : `<span class="no-image" aria-hidden="true">🖼️</span>`
          }
          <span class="tag">${Number(product.price).toFixed(2)} €</span>
        </div>
        <div class="card-body">
          <h3>${name}</h3>
          ${product.description ? `<p class="desc">${escapeHtml(product.description)}</p>` : ''}
          ${isOwner ? `
            <div class="card-actions">
              <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${product.id}">Modifier</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${product.id}">Supprimer</button>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// 6. CRÉATION & MISE À JOUR (CREATE / UPDATE)
// ============================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) {
    showToast('Vous devez être connecté pour ajouter un produit.', 'error');
    return;
  }

  const id = productIdInput.value;
  const file = imageFileInput.files[0];
  let imageUrl = currentImageUrl;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Traitement...';

  try {
    if (file) {
      submitBtn.textContent = 'Upload...';
      imageUrl = await uploadImage(file);
    }

    const productData = {
      name: nameInput.value.trim(),
      description: descInput.value.trim() || null,
      price: parseFloat(priceInput.value),
      image_url: imageUrl,
      user_id: currentUser.id // <-- On lie le produit à l'utilisateur connecté
    };

    if (!productData.name || isNaN(productData.price)) {
      showToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }

    if (id) {
      const { error } = await supabaseClient
        .from('products')
        .update(productData)
        .eq('id', id);

      if (error) throw error;
      showToast('Modifications enregistrées.');
    } else {
      const { error } = await supabaseClient
        .from('products')
        .insert([productData]);

      if (error) throw error;
      showToast('Produit publié.');
    }

    resetForm();
    await loadProducts();
  } catch (err) {
    console.error('Erreur sauvegarde:', err);
    showToast('Erreur lors de la sauvegarde', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = id ? 'Enregistrer' : 'Publier';
  }
});

// ============================================
// 7. GESTION DES CLICS (ÉDITION & SUPPRESSION)
// ============================================
container.addEventListener('click', async (e) => {
  const button = e.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'edit') {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) fillFormForEdit(data);
    } catch (err) {
      console.error('Erreur édition:', err);
      showToast('Impossible de charger le produit', 'error');
    }
  }

  if (action === 'delete') {
    if (!confirm('Supprimer ce produit définitivement ?')) return;

    try {
      const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Produit supprimé.');
      await loadProducts();
    } catch (err) {
      console.error('Erreur suppression:', err);
      showToast('Erreur lors de la suppression', 'error');
    }
  }
});

// ============================================
// 8. ANNULATION
// ============================================
cancelBtn.addEventListener('click', resetForm);

// ============================================
// 9. INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier s'il y a une session active au chargement
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    currentUser = session.user;
  }
  // Le listener onAuthStateChange s'occupera du reste
});