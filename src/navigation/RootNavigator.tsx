import React from 'react';
import { View } from 'react-native';
import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getScreens, getSubTabs, getTabs } from '@/core/registry';
import { DevMenu } from '@/dev/DevMenu';
import { SubTabBar } from './SubTabBar';
import { TabBar } from './TabBar';

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();

function EmptyScreen(): React.JSX.Element {
  return <View />;
}

function renderTabBar(props: BottomTabBarProps): React.JSX.Element {
  return <TabBar {...props} />;
}

function renderSubTabBar(props: MaterialTopTabBarProps): React.JSX.Element {
  return <SubTabBar {...props} />;
}

const topTabScreenOptions = {
  lazy: true,
  swipeEnabled: true,
};

type TabSubHostProps = {
  route: { name: string };
};

function TabSubHost({ route }: TabSubHostProps): React.JSX.Element {
  const subTabs = getSubTabs(route.name);

  return (
    <TopTab.Navigator
      tabBar={renderSubTabBar}
      screenOptions={topTabScreenOptions}
    >
      {subTabs.map(subTab => (
        <TopTab.Screen
          key={subTab.id}
          name={subTab.id}
          component={subTab.component}
          options={{ title: subTab.title }}
        />
      ))}
    </TopTab.Navigator>
  );
}

const bottomTabScreenOptions = {
  headerShown: false,
  lazy: true,
};

function TabsNavigator(): React.JSX.Element {
  const tabs = getTabs();

  return (
    <BottomTab.Navigator
      tabBar={renderTabBar}
      screenOptions={bottomTabScreenOptions}
    >
      {tabs.map(tab => {
        const subTabs = getSubTabs(tab.id);
        const Component = subTabs.length > 0 ? TabSubHost : tab.component ?? EmptyScreen;

        return (
          <BottomTab.Screen
            key={tab.id}
            name={tab.id}
            component={Component}
            options={{ title: tab.title }}
          />
        );
      })}
    </BottomTab.Navigator>
  );
}

const rootStackScreenOptions = {
  headerShown: false,
};

const devMenuOptions = {
  presentation: 'modal' as const,
};

export function RootNavigator(): React.JSX.Element {
  const screens = getScreens();
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

  return (
    <Stack.Navigator screenOptions={rootStackScreenOptions}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      {screens.map(screen => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
      {isDev && (
        <Stack.Screen
          name="DevMenu"
          component={DevMenu}
          options={devMenuOptions}
        />
      )}
    </Stack.Navigator>
  );
}
