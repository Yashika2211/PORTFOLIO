export const BOOT_KEY = "yashu:booted:v1";

/**
 * Runs before first paint (inlined in <head>) so returning visitors and
 * reduced-motion users never see the boot overlay flash.
 */
export const bootGateScript = `try{if(localStorage.getItem("${BOOT_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches||location.pathname.startsWith("/recruiter"))document.documentElement.classList.add("booted")}catch(e){}`;
