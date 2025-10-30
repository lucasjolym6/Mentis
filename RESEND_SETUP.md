# Configuration Resend - Email Expéditeur

## 📧 Email Expéditeur : Explication Simple

L'email expéditeur est l'adresse email **depuis laquelle** vos invitations seront envoyées.

### ✅ Option 1 : Pour tester (Recommandé pour démarrer)

**Vous n'avez rien à faire !** 

L'application utilise automatiquement `onboarding@resend.dev` qui est fourni par Resend pour les tests.

```
# Dans .env.local, vous avez juste besoin de :
RESEND_API_KEY=re_votre_cle_api

# Laissez RESEND_FROM_EMAIL vide (ou ne le définissez pas)
```

⚠️ **Limite** : Cette adresse de test ne peut envoyer qu'un nombre limité d'emails par jour.

---

### ✅ Option 2 : Pour la production (Votre propre domaine)

Si vous voulez utiliser votre propre domaine (ex: `noreply@mentis.app`), vous devez :

1. **Vérifier votre domaine dans Resend** :
   - Allez sur https://resend.com/domains
   - Cliquez sur "Add Domain"
   - Entrez votre domaine (ex: `mentis.app`)
   - Ajoutez les enregistrements DNS que Resend vous donne (SPF, DKIM, DMARC)
   - Attendez que le statut soit "Verified" (✅)

2. **Définir l'email expéditeur dans `.env.local`** :
   ```env
   RESEND_API_KEY=re_votre_cle_api
   RESEND_FROM_EMAIL=noreply@mentis.app
   ```

3. **C'est tout !** L'application utilisera automatiquement cette adresse.

---

## 🚀 Configuration minimale pour démarrer

Dans votre fichier `.env.local`, ajoutez simplement :

```env
# Clé API Resend (obligatoire)
RESEND_API_KEY=re_votre_cle_api

# Email expéditeur (optionnel - laissé vide = utilise onboarding@resend.dev)
# RESEND_FROM_EMAIL=noreply@votredomaine.com
```

---

## ❓ FAQ

**Q : Puis-je utiliser n'importe quelle adresse email ?**  
R : Non, vous devez soit utiliser l'adresse de test Resend (`onboarding@resend.dev`), soit vérifier votre propre domaine dans Resend.

**Q : Comment savoir si mon domaine est vérifié ?**  
R : Allez sur https://resend.com/domains - le statut doit être "Verified" (✅).

**Q : Que se passe-t-il si je n'ai pas de domaine ?**  
R : Utilisez l'adresse de test Resend (`onboarding@resend.dev`) - cela fonctionne sans configuration supplémentaire.

---

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. Créez un Mentis
2. Cliquez sur "Partager"
3. Entrez une adresse email de test (la vôtre par exemple)
4. L'email devrait arriver dans quelques secondes

Si l'email n'arrive pas :
- Vérifiez que `RESEND_API_KEY` est correct
- Vérifiez les logs dans la console du serveur
- Vérifiez que le domaine est vérifié (si vous utilisez votre propre domaine)

