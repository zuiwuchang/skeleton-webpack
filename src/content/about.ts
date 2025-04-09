import { Alpine } from 'alpinejs'
import { createNavComponent } from '../../template/components/nav-component';
declare const Alpine: Alpine
document.addEventListener('alpine:init', () => {
    createNavComponent('topNav', Alpine)
})