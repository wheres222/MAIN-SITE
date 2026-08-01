import type { ReactNode } from "react";
import { Code, Fixes, Note, Step, Warn } from "@/components/guide-blocks";
import { productSlugFromName } from "@/lib/product-route";

/**
 * Setup guides shown in the right-hand pane of /guide.
 *
 * Two ways to match a product:
 *  - SLUG_GUIDES keys on the exact product slug (same slug as /products/<slug>).
 *  - FAMILY_GUIDES matches a whole product line by name, so "Ancient - Rust
 *    External", "Ancient COD" and the rest all share the one Ancient guide.
 *
 * Slug matches win, so a single product can override its family's guide.
 */

// ── Ancient ──────────────────────────────────────────────────────────────────

const ANCIENT_GUIDE = (
  <>
    <p>Applies to every Ancient product. A built-in HWID spoofer is included.</p>

    <Note>The Ancient spoofer is detected on most games.</Note>

    <h3>Compatibility</h3>
    <ul className="guide-list">
      <li>Windows 10, and Windows 11 21H2, 22H2, 23H2, 24H2 and 25H2.</li>
    </ul>

    <h3>Before you start</h3>
    <Warn>
      Disable your PC&apos;s PIN password and BitLocker before using Ancient. Disabling TPM and
      Hyper-V on recent Windows builds can lock you out of your own PC if a PIN is still set.
    </Warn>

    <h3>Pre-injection setup (required)</h3>
    <p>Complete every step below before launching the loader — skipping any one of them will stop it working.</p>
    <ul className="guide-list">
      <li>Disable Windows real-time protection.</li>
      <li>Disable Windows Defender (use Sordum DControl).</li>
      <li><strong>Uninstall</strong> all antivirus software — disabling is not enough.</li>
      <li>Disable all startup apps.</li>
      <li>Disable Exploit Protection.</li>
      <li>Disable every overlay except the one you are using for this product.</li>
      <li>Completely uninstall Faceit and Vanguard.</li>
      <li>Restart your PC after making these changes.</li>
    </ul>

    <h3>Overlay setup (choose one)</h3>
    <Warn>The cheat does not support exclusive fullscreen. Use Windowed, Borderless, or Fullscreen (Windowed).</Warn>
    <p><strong>Option 1 — Discord overlay:</strong> Discord Settings → Game Overlay → enable the overlay and disable Legacy Overlay. If you see &quot;No suitable overlay&quot;, toggle the overlay off and back on.</p>
    <p>
      <strong>Option 2 — Medal overlay:</strong> download from{" "}
      <a className="guide-link" href="https://medal.tv/download" target="_blank" rel="noopener noreferrer">medal.tv/download</a>,
      create an account and install the overlay. Users in Russia need a VPN to download it.
    </p>

    <h3>Injecting</h3>
    <Step n={1} title="Launch the loader">
      Download it from{" "}
      <a className="guide-link" href="http://undetect.net/download/loader" target="_blank" rel="noopener noreferrer">undetect.net/download/loader</a>.
      If it will not load or download, use a VPN.
    </Step>
    <Step n={2} title="Enter your key" />
    <Step n={3} title="Press Inject" />
    <Step n={4} title="Let the loader close">
      It closes automatically after injecting — this is normal.
    </Step>
    <Step n={5} title="Launch your game">
      Open the menu with the <strong>INSERT</strong> key.
    </Step>

    <h3>If your PC reboots 2–3 times in a row</h3>
    <p>Open CMD as administrator and run:</p>
    <Code>bcdedit /set hypervisorlaunchtype auto</Code>

    <h3>Common errors</h3>
    <Fixes
      items={[
        { problem: "\"Please launch SteelSeries moment overlay\" (NVIDIA / GeForce)", fix: "Disable and re-enable the GeForce overlay." },
        { problem: "\"Please launch SteelSeries Sonar overlay\"", fix: "Press the Sonar bind before launching so the overlay activates." },
        { problem: "Flickering menus or black screens in game", fix: "SteelSeries → Settings → Moments → Capture and Sound → turn off \"Allow Moments to Capture While Gaming\"." },
        { problem: "\"Please disable Intel Rapid Storage Technology\"", fix: <>RST must be disabled. <a className="guide-link" href="https://answers.microsoft.com/en-us/windows/forum/all/uninstalling-the-intelr-rapid-storage-technology/e3c4b6d6-56ba-4ac5-be50-89843c9d9b22" target="_blank" rel="noopener noreferrer">Instructions here</a>.</> },
        { problem: "Bind button does not work", fix: "Reinject. If that does not help, run the overlay as administrator." },
        { problem: "No menu appears, or the loader closes immediately", fix: <>Install <a className="guide-link" href="https://aka.ms/vs/17/release/vc_redist.x64.exe" target="_blank" rel="noopener noreferrer">the VC++ redistributable</a>.</> },
        { problem: "\"Unsupported firmware\"", fix: "Convert the OS disk to GPT with mbr2gpt and switch the BIOS from Legacy to UEFI." },
        { problem: "Error 0x296", fix: "Reinject." },
        { problem: "\"Unknown network error\"", fix: "A connection problem. Check your internet, and disable your VPN if you are using one." },
        { problem: "\"Failed to allocate memory / to map memory — Please reboot pc and try again\"", fix: <>The driver installed incorrectly. Reboot and retry. If it recurs, clean your startup programs with <a className="guide-link" href="https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns" target="_blank" rel="noopener noreferrer">Autoruns</a> and disable everything non-system — drivers from uninstalled programs can linger.</> },
        { problem: "\"Failed to load dependencies — Make sure all antiviruses are disabled\"", fix: "Turn off all protection and remove every anti-cheat and antivirus. If that does not help, clean your startup programs." },
        { problem: "\"Please uninstall Vanguard/Faceit first\"", fix: "Uninstall the Vanguard or FaceIt anti-cheat." },
        { problem: "\"AES instruction set is not supported\"", fix: "Your processor does not support AES. This cannot be fixed." },
        { problem: "\"Please enable Intel VT-X/AMD-V in the BIOS\"", fix: "In BIOS, find \"Intel Virtualization Technology\", \"Intel VT-X\", \"AMD-V\" or \"SVM mode\" and enable it." },
        { problem: "\"Either virtual or RAID disk is present\"", fix: "Turn off the spoofer, or turn off RAID in BIOS and reinstall Windows." },
        { problem: "\"CRD failed at XXX / Failed to init render\"", fix: "Desktops: the GPU is too old. Laptops: disable the integrated GPU in BIOS." },
      ]}
    />

    <h3>&quot;VMX/SVM is not supported&quot;</h3>
    <p>Control Panel → Programs → Turn Windows features on or off, and make sure &quot;Virtual Machine Platform&quot; and &quot;Hyper-V&quot; are disabled. If it persists, open CMD as administrator:</p>
    <Code>bcdedit /set hypervisorlaunchtype off</Code>
    <p>Then restart. On Windows 11, if that still does not help, run PowerShell as administrator and enter these one at a time:</p>
    <Code>{`takeown /F "C:\\Windows\\System32\\hvix64.exe"
icacls "C:\\Windows\\System32\\hvix64.exe" /grant *$(([System.Security.Principal.WindowsIdentity]::GetCurrent()).User.Value):F
takeown /F "C:\\Windows\\System32\\hvax64.exe"
icacls "C:\\Windows\\System32\\hvax64.exe" /grant *$(([System.Security.Principal.WindowsIdentity]::GetCurrent()).User.Value):F
del "C:\\Windows\\System32\\hvix64.exe"
del "C:\\Windows\\System32\\hvax64.exe"`}</Code>

    <h3>&quot;Incorrect HWID&quot;</h3>
    <p>Open CMD as administrator and run:</p>
    <Code>{`wmic diskdrive get Caption, SerialNumber
wmic baseboard get SerialNumber`}</Code>
    <p>If either command errors, something is wrong with your PC — try reinstalling Windows.</p>

    <h3>Ancient COD and Ancient Battlefield 6 only</h3>
    <ul className="guide-list">
      <li>SVM (AMD) or VT-X (Intel) enabled in BIOS.</li>
      <li>16 GB RAM or more.</li>
      <li>Hyper-V disabled — AMD CPUs only.</li>
      <li>Secure Boot enabled.</li>
    </ul>

    <h3>Still stuck?</h3>
    <p>Most failures come down to Hyper-V not being fully disabled, antivirus still running, or wrong BIOS settings. Check those three first.</p>
  </>
);

// ── Arcane ───────────────────────────────────────────────────────────────────

const ARCANE_GUIDE = (
  <>
    <Warn>
      Using this software is always a risk and you buy it at your own risk. Undetected status is not a
      guarantee against a ban in any game. If the game has just patched, wait for a software update
      before launching. Do not use it on your main account.
    </Warn>

    <h3>Before activating your key</h3>
    <ul className="guide-list">
      <li>Install the DirectX and Visual C++ runtimes from the <strong>Downloads</strong> guide.</li>
      <li>Read these instructions all the way through.</li>
      <li>Restart your computer before launching the software — this is mandatory.</li>
      <li>Disable Intel Rapid Storage Technology in BIOS.</li>
    </ul>

    <h3>Disable or delete — mandatory</h3>
    <ul className="guide-list">
      <li>Remove your antivirus.</li>
      <li>Disable SmartScreen.</li>
      <li>Disable Windows Defender.</li>
      <li>Delete FaceIt (CS:GO anti-cheat) and Vanguard (Valorant anti-cheat).</li>
    </ul>

    <h3>Graphics card preparation</h3>
    <p>You need an NVIDIA or AMD card.</p>
    <p><strong>NVIDIA:</strong> install the NVIDIA App, sign in, update to the latest driver, and enable the NVIDIA overlay.</p>
    <p><strong>AMD:</strong> install AMD Software: Adrenalin Edition (the PRO edition does not work), update to the latest driver, enable the in-game overlay in settings, and enable performance display in the performance tab.</p>

    <h3>Visible check — CS2 only</h3>
    <ul className="guide-list">
      <li>Ask support for the maps archive, then unzip its <code>Maps</code> folder to <code>C:\ProgramData\TdgDsOv9~PCu\CS2</code>, creating those folders yourself if they do not exist.</li>
      <li>In the cheat menu choose MISC → Visible Check Type → Map Ray Tracer.</li>
      <li>Then MISC → Map Selector, and pick the map you are playing.</li>
    </ul>

    <h3>Starting up</h3>
    <Step n={1} title="Download the loader">
      Put it anywhere — its own folder is best.{" "}
      <a className="guide-link" href="https://storage.e-arcane.com/LoaderArcane.zip" target="_blank" rel="noopener noreferrer">Loader</a>,{" "}
      <a className="guide-link" href="https://mega.nz/folder/SFEijIYB#ItpPdnVINK3H-rQXK6DJjw" target="_blank" rel="noopener noreferrer">mirror 1</a>,{" "}
      <a className="guide-link" href="https://disk.yandex.ru/d/68JncC0ROmFEzA" target="_blank" rel="noopener noreferrer">mirror 2</a>.
    </Step>
    <Step n={2} title="Run it as administrator">
      After it updates itself, run it again.
    </Step>
    <Step n={3} title="Enter your key and press Enter">
      In the CMD loader, paste with right mouse button.
    </Step>
    <Step n={4} title="Answer the prompts">
      Press Yes if you want traces cleaned, and Yes if you want the HWID spoofer.
    </Step>
    <Step n={5} title="Launch the game">
      The loader closes itself once loading succeeds, and the menu appears automatically.
    </Step>

    <h3>Menu controls</h3>
    <ul className="guide-list">
      <li><strong>Home</strong> or <strong>Insert</strong> opens and closes the menu.</li>
      <li>Unturned uses <strong>DEL</strong>.</li>
      <li>PUBG uses <strong>Insert</strong>, and the menu is only visible in a match, not the lobby. Navigate it with the arrow keys.</li>
      <li><strong>END</strong> unloads the software.</li>
    </ul>

    <h3>Common errors</h3>
    <Fixes
      items={[
        { problem: "General library error", fix: <>Install the runtimes from the <strong>Downloads</strong> guide. On AMD, close every AMD process in Task Manager (Radeon, AMDSrv, AMDOW, CPUMetrics and the rest), extract Libs.rar over <code>C:\Program Files\AMD\CNext\CNext</code> replacing the DLLs, then restart AMD Software and re-enable performance metrics. If a file says it is open in another program, an AMD process is still running.</> },
        { problem: "\"Failed to map memory\"", fix: "With under 12 GB of RAM, ask your retailer for a refund. Otherwise disable all startup programs and reboot. If it persists, use AutoRuns to disable everything under CurrentVersion\\Run." },
        { problem: "Loader closes with no error", fix: <>Install the runtimes from the <strong>Downloads</strong> guide.</> },
        { problem: "Menu visible but not clickable", fix: "Run the overlay as administrator, run Steam without admin rights, and disable third-party overlays — keep only NVIDIA or AMD. Disable the EA App overlay if you launch through it." },
        { problem: "Windows 10 — \"Make sure all antiviruses are disabled\"", fix: "Uninstall third-party antivirus, disable real-time protection, disable SmartScreen." },
        { problem: "Windows 11 — \"Make sure all antiviruses are disabled\"", fix: "Ask support for the Turn_ON / Turn_OFF registry pair. Run Turn_ON, accept the registry change and restart; then run Turn_OFF, accept, and restart again. If that fails, confirm your antivirus is fully removed and real-time protection is off." },
        { problem: "Menus disappear in game, or visuals stop working", fix: "If the game just patched, wait for an update. Verify the game files, though a full reinstall is better. Then contact support." },
        { problem: "\"AES instruction set is not supported\"", fix: "Your processor lacks AES and this cannot be fixed. Contact support for a refund." },
        { problem: "\"Please enable Intel VT-X in the BIOS\"", fix: "In BIOS, enable \"Intel virtualization technology\" or \"Intel VT-X\"." },
        { problem: "\"Please enable AMD-V in BIOS\"", fix: "In BIOS, enable \"AMD-V\" or \"SVM mode\"." },
        { problem: "\"Please disable secure boot in the BIOS\"", fix: "Disable Secure Boot in BIOS." },
        { problem: "\"Unsupported firmware\"", fix: "Convert the OS disk to GPT with the built-in mbr2gpt tool or any disk utility." },
        { problem: "\"Secure boot keys are incorrect and need to be enrolled\"", fix: <>Enable Secure Boot in BIOS and save. Confirm with <code>Confirm-SecureBootUEFI</code> in PowerShell — if it returns True, reboot, then go back into BIOS and disable Secure Boot again.</> },
        { problem: "\"Incorrect HWID\"", fix: "Run wmic diskdrive get Caption, SerialNumber and wmic baseboard get SerialNumber in an admin CMD. If either errors, reinstall Windows." },
      ]}
    />

    <h3>&quot;Please make sure PIN is not set in Windows sign-in options and manually disable Hyper-V&quot;</h3>
    <p>Remove the Windows login password entirely, then temporarily disable CPU virtualization in BIOS. Then run PowerShell as administrator and paste all of these at once:</p>
    <Code>{`takeown /F "C:\\Windows\\System32\\hvix64.exe"
icacls "C:\\Windows\\System32\\hvix64.exe" /grant *$(([System.Security.Principal.WindowsIdentity]::GetCurrent()).User.Value):F
takeown /F "C:\\Windows\\System32\\hvax64.exe"
icacls "C:\\Windows\\System32\\hvax64.exe" /grant *$(([System.Security.Principal.WindowsIdentity]::GetCurrent()).User.Value):F
del "C:\\Windows\\System32\\hvix64.exe"
del "C:\\Windows\\System32\\hvax64.exe"`}</Code>

    <h3>&quot;VMX/SVM is not supported&quot;</h3>
    <p>Control Panel → Programs and Features → Turn Windows features on or off, and confirm &quot;Virtual machine platform&quot; and &quot;Hyper-V&quot; are disabled. If it persists, in an admin CMD:</p>
    <Code>bcdedit /set hypervisorlaunchtype off</Code>
    <p>Then reboot.</p>

    <Note>For anything not covered here, contact support on the website.</Note>
  </>
);

// ── Crusader — R6 ────────────────────────────────────────────────────────────

const CRUSADER_R6_GUIDE = (
  <>
    <Step n={1} title="Run the loader as administrator">
      Right-click the cheat loader and choose Run as Administrator.
    </Step>
    <Step n={2} title="Enter your serial key">
      Type it into the Serial Key field.
    </Step>
    <Step n={3} title="Click Sign In" />
    <Step n={4} title="Wait for authentication">
      The R6S icon appears once it finishes.
    </Step>
    <Step n={5} title="Click Start Injection Process" />
    <Step n={6} title="Wait for the prompt">
      You will see &quot;Please Open Rainbow Six Siege&quot;.
    </Step>
    <Step n={7} title="Launch Rainbow Six Siege" />
    <Step n={8} title="Open the menu">
      At the main menu, press <strong>INSERT</strong>.
    </Step>
    <Note>Press INSERT at any time to toggle the menu open or closed.</Note>
  </>
);

// ── Predator — CS2 ───────────────────────────────────────────────────────────

const PREDATOR_CS2_GUIDE = (
  <>
    <Step n={1} title="Register an account">
      Go to{" "}
      <a className="guide-link" href="https://predator.systems/products/" target="_blank" rel="noopener noreferrer">predator.systems/products</a>{" "}
      and sign up.
    </Step>
    <Step n={2} title="Activate your key" />
    <Step n={3} title="Download the loader">
      From{" "}
      <a className="guide-link" href="https://predator.systems/panel/subscriptions" target="_blank" rel="noopener noreferrer">your subscriptions panel</a>.
    </Step>

    <h3>Pre-launch setup</h3>
    <ul className="guide-list">
      <li>Temporarily disable your antivirus, and uninstall it if necessary.</li>
      <li>Turn off Microsoft Defender to avoid conflicts.</li>
      <li>Do not use the <code>-vulcan</code> launch option — it is not supported.</li>
      <li>Make sure your Windows time is synchronised.</li>
    </ul>

    <h3>Disable driver anti-cheats</h3>
    <p>For Faceit, in an admin CMD:</p>
    <Code>sc stop faceit</Code>
    <p>For Valorant:</p>
    <Code>{`sc stop vgc
sc stop vgk`}</Code>

    <h3>Troubleshooting</h3>
    <Fixes
      items={[
        { problem: "\"An error occurred in the secure channel support\" / \"The request has timed out\" / \"The operation timed out\"", fix: "Traffic is being blocked by an anti-cheat, antivirus, firewall or your ISP. Fully uninstall your antivirus and anti-cheat software — disabling is often not enough. Resync your time and region in Windows settings, and try toggling a VPN on or off." },
        { problem: "\"Internal public server error\"", fix: "Same cause — traffic is blocked. Fully uninstall your antivirus and anti-cheat software rather than just disabling them." },
        { problem: "\"Antivirus Interference detected\"", fix: "Fully uninstall your antivirus and anti-cheat software, then scan your PC to confirm it is not actually infected." },
        { problem: "\"Reason: [] sym:\"", fix: "Open a Discord ticket with a screenshot of the error. Press WIN + R, type winver, and include that information too." },
        { problem: "\"modules::load_module: failed to create section\"", fix: "Fully uninstall your antivirus and anti-cheat software — disabling may not be sufficient." },
      ]}
    />
  </>
);

// ── Stealth — Rust ───────────────────────────────────────────────────────────

const STEALTH_RUST_GUIDE = (
  <>
    <Warn>Close the game and any game launcher before starting the product.</Warn>

    <Step n={1} title="Download and run the downloader">
      It usually has a <code>.com</code> or <code>.exe</code> extension.{" "}
      <a className="guide-link" href="https://e.pcloud.link/publink/show?code=kZFt5IZpPnS8QYEjcXiIuAEDUbMxFfPXKCX" target="_blank" rel="noopener noreferrer">Download here</a>.
      The bootloader runs with administrator privileges by default.
    </Step>
    <Step n={2} title="Enter your key and click Activate" />
    <Step n={3} title="Click Run">
      Once you are logged into the bootloader.
    </Step>
    <Step n={4} title="Wait for the reboot">
      After the countdown the system reboots automatically. You should see the product logo in place
      of your motherboard&apos;s usual logo.
    </Step>
    <Step n={5} title="Launch the game">
      Back on your desktop, start the game. The menu should appear within a minute.
    </Step>

    <Warn>
      Do not interrupt the startup process between clicking start and reaching the desktop. Doing so
      can break your boot partition and leave you unable to log into Windows.
    </Warn>

    <h3>Hotkeys</h3>
    <ul className="guide-list">
      <li><strong>HOME</strong> — open and close the menu. Rebindable to any key you prefer.</li>
      <li><strong>END</strong> — unload the product, for example to pass a cheat check. The menu can only be brought back by restarting.</li>
    </ul>
  </>
);

// ── NFA (temporary) accounts ─────────────────────────────────────────────────

const NFA_ACCOUNT_GUIDE = (
  <>
    <p>
      NFA stands for <strong>Not Full Access</strong> — you get the login, but not the recovery
      options or original email. These are meant to be used the moment you buy them.
    </p>

    <Warn>
      No refunds if the account is invalid minutes or hours after purchase. Expiry is not up to us.
    </Warn>

    <h3>Do</h3>
    <ul className="guide-list">
      <li>Use the account as soon as you buy it.</li>
      <li>Set yourself to invisible once in game — it lasts longer that way.</li>
      <li>Use the loader that comes with the account. It only signs you into the Steam account.</li>
    </ul>

    <h3>Do not</h3>
    <ul className="guide-list">
      <li>
        Do not log in just to &quot;check&quot; the account. Logging in can refresh or break the
        token and make it go invalid sooner.
      </li>
      <li>Do not log in today if you want to use it tomorrow.</li>
      <li>Do not log out — once you do, the account becomes invalid.</li>
    </ul>

    <h3>What to expect</h3>
    <ul className="guide-list">
      <li>An account can last anywhere from a minute to a couple of weeks.</li>
      <li>Hours played are real, not boosted.</li>
      <li>Accounts occasionally pick up a delayed game ban earned by the previous user.</li>
      <li>Once an NFA account is banned or recovered by its original owner, there is no recovery.</li>
    </ul>

    <Note>
      The loader has nothing to do with Rust bans and nothing to do with the game itself — it only
      signs you into the Steam account.
    </Note>

    <h3>Why players use them</h3>
    <p>
      These accounts suit short-term or risky play without touching your main profile: if you are
      banned you can be back in game immediately, and the low price reflects the limited access and
      disposable nature. Delivery is automated so you can cycle through accounts quickly.
    </p>
    <p>
      Recorded playtime matters on servers that filter by account age and hours. An account with
      hours on it looks more legitimate and is less likely to be kicked or reported on sight —
      helpful on low-activity servers where admin action follows community reports. It does not stop
      anti-cheat detection, only the social side of it. Accounts with a clean Steam record and no
      visible bans, plus at least ten hours of play to clear new-player filters, hold up best.
    </p>
  </>
);

// ── Matching ─────────────────────────────────────────────────────────────────

const SLUG_GUIDES: Record<string, ReactNode> = {
  "crusader-r6-full": CRUSADER_R6_GUIDE,
  "predator-cs2": PREDATOR_CS2_GUIDE,
  "stealth-rust": STEALTH_RUST_GUIDE,
  "rust-temporary-account": NFA_ACCOUNT_GUIDE,
  "arc-raiders-temporary-account": NFA_ACCOUNT_GUIDE,
};

const FAMILY_GUIDES: { match: RegExp; content: ReactNode }[] = [
  { match: /^ancient\b/i, content: ANCIENT_GUIDE },
  { match: /^arcane\b/i, content: ARCANE_GUIDE },
];

/** The guide for a product, or null when none has been written yet. */
export function guideForProduct(product: { id: number; name: string }): ReactNode | null {
  const slug = productSlugFromName(product.name, product.id);
  if (SLUG_GUIDES[slug]) return SLUG_GUIDES[slug];

  const name = (product.name || "").trim();
  for (const family of FAMILY_GUIDES) {
    if (family.match.test(name)) return family.content;
  }
  return null;
}
