ViaggiaTreno RailCore
ViaggiaTreno RailCore è un'interfaccia web moderna per il monitoraggio in tempo reale del traffico ferroviario in mondi Minecraft che utilizzano la mod RailCore. Il sito permette di visualizzare i treni in servizio, gli orari in tempo reale, i tabelloni delle partenze per ogni stazione e di calcolare percorsi tra diverse destinazioni.
---
Come attivarlo in Singleplayer (Locale)
Per utilizzare il sito con il tuo mondo locale in Singleplayer su Minecraft, segui questi semplici passaggi:
1. Prerequisiti
Assicurati di avere la mod RailCore installata nel tuo client Minecraft.
Assicurati che l'API web della mod sia attiva nelle opzioni o nel file di configurazione della mod (di default in ascolto sulla porta `25580`).
2. Avviare il Server Web Locale
Poiché il sito utilizza i moduli JavaScript moderni (`ES6`), è necessario servirlo tramite un server locale per evitare blocchi del browser.
Apri il Prompt dei comandi (CMD) o il terminale nella cartella del progetto.
Esegui il seguente comando Python:
```cmd
   python -m http.server 8000
   ```
Lascia la finestra del terminale aperta e avvia la tua partita a Minecraft.
Apri il browser web e vai all'indirizzo:
```text
   http://localhost:8000
   ```
---
Come personalizzare Categorie, Loghi e Nomi
Tutta la mappatura dei loghi e dei nomi delle categorie dei treni è centralizzata nel file `categories.json`, situato nella cartella radice del progetto.
1. Modificare il file `categories.json`
Apri il file `categories.json` con un editor di testo (es. VS Code, Blocco Note) e aggiungi o modifica le categorie esistenti:
```json
{
  "R": {
    "name": "Regionale",
    "logo": "regionale.png"
  },
  "RV": {
    "name": "Regionale Veloce",
    "logo": "regionale.png"
  },
  "RE": {
    "name": "Regioexpress",
    "logo": "regioexpress.png"
  },
  "IC": {
    "name": "Intercity",
    "logo": "intercity.png"
  },
  "FR": {
    "name": "Frecciarossa",
    "logo": "frecciarossa.png"
  }
}
```
Chiave (es. `"R"`, `"FR"`): Corrisponde al codice della categoria o alla stringa restituita dall'API della mod per quel treno.
`name`: Il nome esteso o visualizzato della categoria.
`logo`: Il nome del file immagine corrispondente (es. `frecciarossa.png`).
2. Aggiungere o sostituire le Immagini
Inserisci le tue immagini in formato `.png` direttamente nella cartella principale del sito (accanto a `index.html` e `categories.json`).
Per una resa grafica ottimale, si consiglia di utilizzare immagini con sfondo trasparente e proporzioni rettangolari o quadrate ben bilanciate.
Assicurati che il nome del file immagine salvato nella cartella corrisponda esattamente a quello indicato nel campo `"logo"` di `categories.json`.
---
Il sito è pensato per il server minecraft Railcore Comunity, se vuoi unirit clicca il link: https://discord.gg/ajK9wSJba
