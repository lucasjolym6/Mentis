# 🔍 Étapes de débogage - Email n'apparaît pas dans Resend

## ❓ Diagnostic : Rien n'apparaît dans Resend

Si rien n'apparaît dans le dashboard Resend (https://resend.com/emails), cela signifie que l'email n'atteint **jamais** l'API Resend. 

Causes probables :
1. ❌ La clé API n'est pas chargée (`RESEND_API_KEY` manquante)
2. ❌ Le fichier `.env.local` n'existe pas ou n'est pas lu
3. ❌ La clé API est incorrecte
4. ❌ Le serveur Next.js n'a pas été redémarré après l'ajout de la clé

---

## ✅ Étapes de vérification

### Étape 1 : Vérifier que `.env.local` existe

```bash
cd frontend
ls -la .env.local
```

**Si le fichier n'existe pas**, créez-le :

```bash
touch .env.local
```

Puis ajoutez :

```env
RESEND_API_KEY=re_votre_cle_api_ici
```

### Étape 2 : Vérifier que la clé API est correcte

Dans `.env.local`, assurez-vous que :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- ✅ La clé commence par `re_`
- ✅ Pas d'espaces avant ou après
- ✅ Pas de guillemets autour de la valeur
- ✅ C'est la clé API complète depuis https://resend.com/api-keys

### Étape 3 : Redémarrer le serveur Next.js

**IMPORTANT** : Next.js ne lit `.env.local` qu'au démarrage. Si vous avez ajouté/modifié la clé, **vous DEVEZ redémarrer** :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
npm run dev
```

### Étape 4 : Tester avec l'endpoint de test

J'ai créé un endpoint de test. Dans votre navigateur ou avec curl :

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"votre@email.com"}'
```

Ou dans votre navigateur, ouvrez la console et faites :

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'votre@email.com' })
}).then(r => r.json()).then(console.log)
```

### Étape 5 : Regarder les logs serveur

Ouvrez la console où tourne `npm run dev` et cherchez :

```
[EMAIL] Checking API key: { exists: true, length: XX, ... }
[EMAIL] 🚀 Calling Resend API...
[EMAIL] ✅ Email sent successfully!
```

**Si vous voyez :**
- `❌ RESEND_API_KEY is missing or empty!` → La clé n'est pas chargée
- `⚠️ API key format might be incorrect` → La clé ne commence pas par `re_`
- Aucun log `[EMAIL]` → La fonction n'est pas appelée

---

## 🐛 Problèmes courants

### Problème 1 : "RESEND_API_KEY is missing"

**Cause :** Le fichier `.env.local` n'est pas lu

**Solutions :**
1. Vérifiez que le fichier s'appelle exactement `.env.local` (pas `.env`, pas `.env.local.txt`)
2. Vérifiez qu'il est dans le dossier `frontend/` (même niveau que `package.json`)
3. **Redémarrez** le serveur Next.js
4. Vérifiez qu'il n'y a pas d'espaces dans le nom de la variable : `RESEND_API_KEY=...` (pas `RESEND_API_KEY = ...`)

### Problème 2 : La clé existe mais ne fonctionne pas

**Vérifications :**
1. Allez sur https://resend.com/api-keys
2. Vérifiez que la clé est **active** (pas révoquée)
3. Copiez la clé à nouveau et remplacez-la dans `.env.local`
4. Redémarrez le serveur

### Problème 3 : Le serveur tourne mais ne voit pas la clé

**Solution :**
1. Arrêtez complètement le serveur (Ctrl+C)
2. Supprimez le dossier `.next` (cache) :
   ```bash
   rm -rf .next
   ```
3. Relancez :
   ```bash
   npm run dev
   ```

---

## 🧪 Test complet

### 1. Vérifier les variables d'environnement

Créez un fichier temporaire `test-env.ts` :

```typescript
// test-env.ts (à supprimer après)
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Définie' : '❌ Manquante')
console.log('Length:', process.env.RESEND_API_KEY?.length || 0)
console.log('Starts with re_:', process.env.RESEND_API_KEY?.startsWith('re_') || false)
```

**Mais attention :** Les variables d'environnement ne sont accessibles que dans les routes API (côté serveur), pas dans les composants client.

### 2. Utiliser l'endpoint de test

L'endpoint `/api/test-email` fait toutes les vérifications :

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Vous devriez voir dans les logs :
```
[TEST EMAIL] Starting email test...
[TEST EMAIL] Environment check: { hasApiKey: true, ... }
[EMAIL] Checking API key: ...
[EMAIL] 🚀 Calling Resend API...
[EMAIL] ✅ Email sent successfully!
```

### 3. Vérifier dans Resend

Après le test, allez sur https://resend.com/emails

Vous devriez voir :
- Un email envoyé vers `test@example.com`
- Statut : "Delivered" ou "Pending"

---

## 📋 Checklist de débogage

- [ ] Le fichier `.env.local` existe dans `frontend/`
- [ ] `RESEND_API_KEY` est défini dans `.env.local`
- [ ] La clé commence par `re_`
- [ ] Pas d'espaces autour du `=` (pas `RESEND_API_KEY = ...`)
- [ ] Le serveur Next.js a été **redémarré** après l'ajout de la clé
- [ ] Les logs `[EMAIL]` apparaissent dans la console serveur
- [ ] Le test avec `/api/test-email` fonctionne
- [ ] L'email apparaît dans https://resend.com/emails

---

## 🆘 Si rien ne fonctionne

1. **Vérifiez les logs** : Regardez la console serveur pour les logs `[EMAIL]`
2. **Copiez les logs** : Copiez tous les logs qui commencent par `[EMAIL]`
3. **Vérifiez Resend** : Allez sur https://resend.com/api-keys et vérifiez que la clé est active
4. **Testez avec curl** : Utilisez l'endpoint `/api/test-email` pour isoler le problème

Les logs vous diront exactement où ça bloque ! 🎯

