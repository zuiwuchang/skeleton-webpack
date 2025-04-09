import { Alpine } from "alpinejs";
import { Theme } from './theme';
export function createNavComponent(name: string, alpinejs: Alpine) {
    const theme = Theme.instance(alpinejs)
    alpinejs.data(name, () => {
        return {
            menuActive: false,
            get menuActiveClass() {
                return this.menuActive ? 'is-active' : ''
            },
            get color() {
                return theme.color
            },
            isTheme(name: string) {
                return theme.is(name) ? 'fa-regular fa-circle-check' : 'fa-regular fa-circle'
            },
            setTheme(name: string) {
                theme.setTheme(name)
            }
        }
    })
}