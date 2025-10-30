# 🔍 Guide de débogage - Emails non reçus

## Problème : L'API indique "succès" mais l'email n'arrive pas

### ✅ Vérifications immédiates

#### 1. Vérifier les logs serveur
Ouvrez la console du serveur (`npm run dev`) et cherchez les logs avec le préfixe `[EMAIL]` :

```
[EMAIL] Attempting to send invitation email: { from: '...', to: '...', ... }
[EMAIL] Email sent successfully: { emailId: '...', to: '...', from: '...' }
```

**Si vous voyez une erreur :**
- Notez le message d'erreur exact
- Vérifiez que `RESEND_API_KEY` est bien défini

#### 2. Vérifier le dashboard Resend
1. Allez sur https://resend.com/emails
2. Vous verrez tous les emails envoyés avec leur statut :
   - ✅ **Delivered** : L'email a été livré
   - ⏳ **Pending** : En cours d'envoi
   - ❌ **Bounced** : Email rejeté par le serveur de destination
   - ❌ **Failed** : Erreur lors de l'envoi

**Si l'email est "Delivered" mais que vous ne le voyez pas :**
- Vérifiez les **spams/courrier indésirable**
- Vérifiez les filtres de votre boîte email
- Attendez quelques minutes (délai de livraison)

#### 3. Limitations de l'adresse de test `onboarding@resend.dev`

Si vous utilisez l'adresse de test (`onboarding@resend.dev`), voici les limitations :

⚠️ **Limitations importantes :**
- ❌ Ne fonctionne **PAS** avec tous les providers d'email
- ❌ Peut être **bloqué** par les filtres anti-spam
- ❌ Peut être **rejeté** par certains serveurs
- ✅ Fonctionne mieux avec : Gmail, Outlook, Yahoo

**Solution : Vérifiez votre domaine dans Resend**
1. Allez sur https://resend.com/domains
2. Vérifiez un domaine (ex: `mentis.app`)
3. Ajoutez les enregistrements DNS
4. Une fois vérifié, utilisez : `RESEND_FROM_EMAIL=noreply@mentis.app`

---

## 🛠️ Solutions par cas

### Cas 1 : Email dans les spams

**Symptômes :**
- L'API retourne `success: true`
- Le dashboard Resend indique "Delivered"
- Vous ne voyez pas l'email dans la boîte de réception

**Solutions :**
1. Vérifiez le dossier **courrier indésirable/spam**
2. Ajoutez `onboarding@resend.dev` à vos contacts autorisés
3. Vérifiez les filtres de votre boîte email
4. Utilisez un domaine vérifié (solution définitive)

### Cas 2 : Email rejeté (Bounced)

**Symptômes :**
- Le dashboard Resend indique "Bounced"

**Causes possibles :**
- Adresse email invalide
- Serveur de destination rejette l'email
- Adresse de test bloquée par le provider

**Solutions :**
1. Vérifiez que l'adresse email est correcte
2. Essayez avec une autre adresse email (Gmail, Outlook)
3. Utilisez un domaine vérifié

### Cas 3 : Erreur lors de l'envoi (Failed)

**Symptômes :**
- L'API retourne `success: false`
- Les logs montrent une erreur Resend

**Causes possibles :**
- `RESEND_API_KEY` invalide ou manquante
- Problème avec l'adresse expéditeur
- Quota Resend dépassé

**Solutions :**
1. Vérifiez que `RESEND_API_KEY` est correct dans `.env.local`
2. Vérifiez votre quota sur https://resend.com/overview
3. Vérifiez que votre domaine est bien vérifié (si vous utilisez votre propre domaine)

---

## 🧪 Test rapide

### Test 1 : Vérifier la configuration

```bash
# Dans votre terminal, vérifiez les variables d'environnement
echo $RESEND_API_KEY
```

### Test 2 : Envoyer un email de test

1. Créez un Mentis
2. Cliquez sur "Partager"
3. Entrez **votre propre adresse email** (celle que vous utilisez pour Resend)
4. Envoyez l'invitation
5. Vérifiez :
   - Les logs serveur (`[EMAIL]`)
   - Le dashboard Resend (https://resend.com/emails)
   - Votre boîte email (et les spams)

### Test 3 : Vérifier avec différents providers

Testez avec différentes adresses email :
- Gmail (fonctionne généralement bien)
- Outlook/Hotmail
- Yahoo
- Votre domaine personnalisé

---

## 📊 Informations de débogage dans l'API

L'API retourne maintenant plus d'informations :

```json
{
  "ok": true,
  "message": "Invitation créée et email envoyé avec succès",
  "invite_url": "https://...",
  "email_sent": true,      // ← Nouveau
  "email_id": "abc123"      // ← Nouveau (ID Resend)
}
```

Si `email_sent: false`, regardez `email_error` pour plus de détails.

---

## 🚨 Causes communes

### 1. Adresse de test bloquée
**Solution :** Utilisez un domaine vérifié dans Resend

### 2. Email dans les spams
**Solution :** Vérifiez votre dossier spam

### 3. Adresse email invalide
**Solution :** Vérifiez que l'adresse est correcte

### 4. Quota Resend dépassé
**Solution :** Vérifiez votre quota sur https://resend.com/overview

### 5. API Key invalide
**Solution :** Régénérez votre clé API sur https://resend.com/api-keys

---

## ✅ Checklist de vérification

- [ ] `RESEND_API_KEY` est défini dans `.env.local`
- [ ] La clé API est correcte (commence par `re_`)
- [ ] Les logs serveur ne montrent pas d'erreur `[EMAIL]`
- [ ] Le dashboard Resend (https://resend.com/emails) montre l'email envoyé
- [ ] Le statut dans Resend est "Delivered"
- [ ] Vous avez vérifié les spams
- [ ] Vous avez testé avec Gmail (meilleur taux de livraison)
- [ ] Si vous utilisez votre domaine : il est vérifié dans Resend

---

## 💡 Solution recommandée

Pour une solution définitive, **vérifiez votre propre domaine** dans Resend :

1. Allez sur https://resend.com/domains
2. Cliquez sur "Add Domain"
3. Entrez votre domaine (ex: `mentis.app`)
4. Ajoutez les enregistrements DNS (SPF, DKIM, DMARC)
5. Attendez la vérification (quelques minutes)
6. Ajoutez dans `.env.local` :
   ```env
   RESEND_FROM_EMAIL=noreply@mentis.app
   ```

Avec un domaine vérifié, vos emails auront un **meilleur taux de livraison** et seront **moins souvent bloqués** par les filtres spam.

---

## 📞 Besoin d'aide ?

Si le problème persiste :
1. Copiez les logs `[EMAIL]` depuis votre console serveur
2. Vérifiez le statut dans le dashboard Resend
3. Notez l'adresse email de destination
4. Vérifiez si c'est une adresse de test ou votre domaine personnalisé

Ces informations permettront d'identifier précisément le problème.

