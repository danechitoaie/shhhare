<script setup lang="ts">
import { ApiReference } from "@scalar/api-reference";
import "@scalar/api-reference/style.css";
</script>

<template>
    <ApiReference
        :configuration="{
            url: '/doc/schema.json',
            hideClientButton: true,
            showDeveloperTools: 'never',
            agent: { disabled: true },
            mcp: { disabled: true },
        }"
    />
</template>
