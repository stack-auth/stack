function initPostHog() {
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]); posthog.init('phc_vIUFi0HzHo7oV26OsaZbUASqxvs8qOmap1UBYAutU4k',{api_host: "https://stack-auth.com/consume",  ui_host: 'https://eu.posthog.com', person_profiles: 'identified_only' })
}

function replaceStackLinkTo() {
  const codeBlocks = document.querySelectorAll(`code.code-block`);
  for (const codeBlock of codeBlocks) {
    const codeBlockSpans = codeBlock.querySelectorAll(`.line > span:last-child:not(.stack-replaced-link-to)`);
    for (const codeSpan of codeBlockSpans) {
      codeSpan.classList.add("stack-replaced-link-to");
      if (codeSpan.textContent.trim().startsWith("//$stack-link-to:")) {
        const href = codeSpan.textContent.trim().slice(17);
        const tr = codeSpan.closest(`tr`);
        tr.classList.add(`stack-clickable-row`);
        if (href.startsWith("#") && window.location.href.includes("localhost")) {
          if (!document.getElementById(href.slice(1))) {
            tr.classList.add(`stack-clickable-row-missing`);
          }
        }
        tr.addEventListener(`click`, () => {
          window.location.href = href;
        });
        codeSpan.remove();
      }
    }
  }
}

function replaceEmptyTabs() {
  const tabs = document.querySelectorAll(`.small-codeblock-tabs button:not(.stack-replaced-empty-tab)`);
  for (const tab of tabs) {
    tab.classList.add(`stack-replaced-empty-tab`);
    if (tab.textContent.trim() === "<<empty>>") {
      tab.remove();
    }
  }
}

function runRenderActions() {
  try {
    replaceStackLinkTo();
    replaceEmptyTabs();
    requestAnimationFrame(runRenderActions);
  } catch (e) {
    console.error(e);
    alert(`Error during custom script while running render actions. This message will only be shown on localhost.\n\n${e} ${e.message} ${e.stack}`);
  }
}

async function main() {
  initPostHog();
  runRenderActions();
}

main().catch((e) => {
  console.error(e);
  if (window.location.href.includes("localhost")) {
    alert(`Error during custom script. This message will only be shown on localhost.\n\n${e} ${e.message} ${e.stack}`);
  }
});
