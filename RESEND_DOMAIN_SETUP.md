# 🔧 Configuration d'un domaine Resend pour envoyer des emails

## ❓ Problème actuel

Vous voyez cette erreur :
```
You can only send testing emails to your own email address (lucasjolym6@gmail.com). 
To send emails to other recipients, please verify a domain at resend.com/domains, 
and change the `from` address to an email using this domain.
```

**Causes :**
- Vous utilisez l'adresse de test `onboarding@resend.dev`
- Cette adresse ne permet d'envoyer qu'à votre propre adresse email (celle de votre compte Resend)
- Pour envoyer à d'autres destinataires, vous devez vérifier un domaine

---

## ✅ Solutions

### Solution 1 : Tester avec votre propre adresse (temporaire)

En attendant de vérifier un domaine, vous pouvez tester avec votre adresse email Resend :
- ✅ `lucasjolym6@gmail.com` fonctionnera
- ❌ Les autres adresses ne fonctionneront pas

### Solution 2 : Vérifier un domaine dans Resend (recommandé)

Pour envoyer à **n'importe quelle adresse email**, vous devez vérifier votre propre domaine :

#### Étape 1 : Acheter un domaine (si vous n'en avez pas)

- [Namecheap](https://www.namecheap.com/) - ~$10/an
- [GoDaddy](https://www.godaddy.com/) - ~$12/an
- [Cloudflare](https://www.cloudflare.com/products/registrar/) - Prix de revient

#### Étape 2 : Vérifier le domaine dans Resend

1. **Allez sur https://resend.com/domains**
2. **Cliquez sur "Add Domain"**
3. **Entrez votre domaine** (ex: `mentis.app`)
4. **Ajoutez les enregistrements DNS** demandés par Resend :
   - **SPF** : `v=spf1 include:_spf.resend.com ~all`
   - **DKIM** : Record fourni par Resend (ex: `resend._domainkey`)
   - **DMARC** : `v=DMARC1; p=none; rua=mailto:dmarc@votredomaine.com`

5. **Attendez la vérification** (quelques minutes)
6. **Une fois vérifié** (✅), vous pouvez utiliser des adresses de ce domaine

#### Étape 3 : Configurer dans `.env.local`

Une fois le domaine vérifié, ajoutez dans `.env.local` :

```env
RESEND_FROM_EMAIL=noreply@mentis.app
```

(Remplacez `mentis.app` par votre domaine)

#### Étape 4 : Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
rm -rf .next
npm run dev
```

---

## 📋 Checklist de vérification

- [ ] Avez-vous un domaine ? (si non, achetez-en un)
- [ ] Le domaine est ajouté dans Resend (https://resend.com/domains)
- [ ] Les enregistrements DNS sont ajoutés (SPF, DKIM, DMARC)
- [ ] Le statut du domaine est "Verified" (✅) dans Resend
- [ ] `RESEND_FROM_EMAIL` est défini dans `.env.local` avec votre domaine
- [ ] Le serveur a été redémarré après l'ajout de la variable

---

## 🔍 Vérification rapide

Pour vérifier si votre domaine est bien configuré :

1. Allez sur https://resend.com/domains
2. Vérifiez que votre domaine a le statut **"Verified"** (✅)
3. Si c'est le cas, vous pouvez utiliser une adresse de ce domaine

**Exemple :**
- ✅ Domaine vérifié : `mentis.app`
- ✅ Email utilisable : `noreply@mentis.app`, `hello@mentis.app`, etc.

---

## 💡 Alternatives temporaires

Si vous ne voulez pas configurer un domaine maintenant, vous pouvez :

1. **Partager le lien manuellement** : L'invitation est créée, vous pouvez copier le lien et l'envoyer manuellement
2. **Tester avec votre adresse** : Utilisez `lucasjolym6@gmail.com` pour tester le système

Mais pour la **production**, vous devrez vérifier un domaine.

---

## 🚀 Une fois le domaine vérifié

Après avoir vérifié votre domaine :

1. **Ajoutez dans `.env.local`** :
   ```env
   RESEND_FROM_EMAIL=noreply@votredomaine.com
   ```

2. **Redémarrez le serveur** :
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Testez** : Vous pouvez maintenant envoyer des emails à n'importe quelle adresse !

---

## 📞 Besoin d'aide ?

- Documentation Resend : https://resend.com/docs/dashboard/domains/introduction
- Support Resend : support@resend.com

