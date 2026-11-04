<script setup lang="ts">
import { Check, Monitor, Moon, Sun } from '@lucide/vue'
import {
    DropdownMenuContent,
    DropdownMenuItemIndicator,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuRoot,
    DropdownMenuTrigger,
} from 'reka-ui'

const { t } = useI18n()
const colorMode = useColorMode()
const options = [
    { value: 'light', label: 'theme.light', icon: Sun },
    { value: 'dark', label: 'theme.dark', icon: Moon },
    { value: 'system', label: 'theme.system', icon: Monitor },
] as const

function selectTheme(value: unknown) {
    if (typeof value === 'string' && options.some(option => option.value === value)) colorMode.preference = value
}
</script>

<template>
    <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
            <UiButton type="button" variant="ghost" size="icon" class="shrink-0" :aria-label="t('theme.label')" :title="t('theme.label')">
                <Sun class="size-4 dark:hidden" aria-hidden="true" />
                <Moon class="hidden size-4 dark:block" aria-hidden="true" />
            </UiButton>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
            <DropdownMenuContent align="end" :side-offset="8" class="z-50 min-w-44 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md print:hidden">
                <DropdownMenuLabel class="px-3 py-2 text-xs font-medium text-muted-foreground">{{ t('theme.label') }}</DropdownMenuLabel>
                <DropdownMenuRadioGroup :model-value="colorMode.preference" @update:model-value="selectTheme">
                    <DropdownMenuRadioItem v-for="option in options" :key="option.value" :value="option.value" class="relative flex cursor-pointer items-center gap-3 rounded-md py-2.5 pr-9 pl-3 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                        <component :is="option.icon" class="size-4 text-muted-foreground" aria-hidden="true" />
                        {{ t(option.label) }}
                        <DropdownMenuItemIndicator class="absolute right-3 flex items-center text-primary"><Check class="size-3.5" aria-hidden="true" /></DropdownMenuItemIndicator>
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>
