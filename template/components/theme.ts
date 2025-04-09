import { Alpine } from "alpinejs";
interface ThemeState {
    theme: null | string
    dark: boolean
}
export class Theme {
    private readonly state_: ThemeState
    private readonly html_ = document.getElementsByTagName("html")[0]
    private static instance_?: Theme
    static instance(alpinejs: Alpine) {
        let i = Theme.instance_
        if (!i) {
            i = new Theme(alpinejs)
            Theme.instance_ = i
        }
        return i
    }
    private constructor(alpinejs: Alpine) {
        const state = alpinejs.reactive<ThemeState>({
            theme: null,
            dark: false
        })
        // 監聽系統主題變化
        const dark = window.matchMedia('(prefers-color-scheme:dark)')
        if (dark.matches) {
            state.dark = true
        } else {
            state.dark = false
        }
        dark.addEventListener('change', (event) => {
            if (event.matches) {
                state.dark = true
            } else {
                state.dark = false
            }
        })

        this.state_ = state
        this.setTheme(localStorage.getItem("theme"))

    }
    /**
     * 設置主題
     */
    setTheme(name: string | null) {
        const state = this.state_
        switch (name) {
            case "Dark":
                if (state.theme != name) {
                    state.theme = name
                    this.html_.setAttribute('data-theme', 'dark')
                    localStorage.setItem("theme", name)
                }
                break
            case "Light":
                if (state.theme != name) {
                    state.theme = name
                    this.html_.setAttribute('data-theme', 'light')
                    localStorage.setItem("theme", name)
                }
                break
            default:
                if (state.theme) {
                    state.theme = null
                    this.html_.removeAttribute('data-theme')
                    localStorage.removeItem("theme")
                }
                break
        }
    }
    /**
     * 返回用戶設置
     */
    getTheme() {
        return this.state_.theme
    }
    /**
     * 返回是否是黑色主題
     */
    get isDark() {
        const state = this.state_
        switch (state.theme) {
            case "Dark":
                return true
            case "Light":
                return false
        }
        return state.dark
    }
    /**
     * 檢查用戶設置
     */
    is(name: string | null) {
        return this.state_.theme === name
    }
    /**
     * 返回當前主題顏色
     */
    get color() {
        return this.isDark ? 'is-dark' : 'is-light'
    }
}
