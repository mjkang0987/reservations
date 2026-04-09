import type {ServiceItem} from '../utils/services';
import {groupCatalogByCategory, reorder} from './calendarStoreHelpers';

export function buildAddedServiceState(serviceCatalog: ServiceItem[], item: ServiceItem) {
    return [...serviceCatalog, item];
}

export function buildUpdatedServiceState(serviceCatalog: ServiceItem[], name: string, updated: ServiceItem) {
    return serviceCatalog.map((service) => service.name === name ? updated : service);
}

export function buildDeletedServiceState(serviceCatalog: ServiceItem[], name: string) {
    return serviceCatalog.filter((service) => service.name !== name);
}

export function buildRenamedCategoryState(
    serviceCatalog: ServiceItem[],
    categoryBaseColorMap: Record<string, string>,
    prevCategory: string,
    nextCategory: string
) {
    const trimmed = nextCategory.trim();
    if (!trimmed || trimmed === prevCategory) return null;
    if (serviceCatalog.some((item) => item.category === trimmed)) return null;

    const nextCatalog = serviceCatalog.map((item) => (
        item.category === prevCategory ? {...item, category: trimmed} : item
    ));

    const nextCategoryBaseColorMap = {...categoryBaseColorMap};
    if (prevCategory in nextCategoryBaseColorMap) {
        nextCategoryBaseColorMap[trimmed] = nextCategoryBaseColorMap[prevCategory];
        delete nextCategoryBaseColorMap[prevCategory];
    }

    return {
        serviceCatalog: nextCatalog,
        categoryBaseColorMap: nextCategoryBaseColorMap,
    };
}

export function buildMovedCategoryState(
    serviceCatalog: ServiceItem[],
    dragCategory: string,
    targetCategory: string
) {
    if (dragCategory === targetCategory) return null;

    const grouped = groupCatalogByCategory(serviceCatalog);
    const categories = Array.from(grouped.keys());
    const dragIndex = categories.indexOf(dragCategory);
    const targetIndex = categories.indexOf(targetCategory);

    if (dragIndex === -1 || targetIndex === -1) return null;

    const nextCategories = reorder(categories, dragIndex, targetIndex);
    return nextCategories.flatMap((category) => grouped.get(category) || []);
}

export function buildMovedServiceInCategoryState(
    serviceCatalog: ServiceItem[],
    dragName: string,
    targetName: string
) {
    if (dragName === targetName) return null;

    const dragIndex = serviceCatalog.findIndex((service) => service.name === dragName);
    const targetIndex = serviceCatalog.findIndex((service) => service.name === targetName);

    if (dragIndex === -1 || targetIndex === -1) return null;

    const targetItem = serviceCatalog[targetIndex];
    const nextCatalog = [...serviceCatalog];
    const [moved] = nextCatalog.splice(dragIndex, 1);
    const movedWithCategory: ServiceItem = {...moved, category: targetItem.category};
    const insertIndex = dragIndex < targetIndex ? targetIndex - 1 : targetIndex;
    nextCatalog.splice(insertIndex, 0, movedWithCategory);
    return nextCatalog;
}
