import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { Drawer } from "expo-router/drawer"
import { AppSidebar } from "@/components/sidebar/app-sidebar"

/** The web's sidebar, which below its `md` breakpoint is exactly this: a panel
 * that slides in over the screen. Every screen inside draws its own header. */
export default function DrawerLayout() {
  const tokens = useTokens()

  return (
    <Drawer
      drawerContent={(props) => <AppSidebar navigation={props.navigation} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { backgroundColor: tokens.sidebar, width: 280 },
        swipeEdgeWidth: 40,
        sceneStyle: { backgroundColor: tokens.sidebar },
      }}
    >
      <Drawer.Screen name="index" options={{ title: "Board" }} />
      <Drawer.Screen name="upcoming" options={{ title: "Upcoming" }} />
      <Drawer.Screen name="trash" options={{ title: "Trash" }} />
    </Drawer>
  )
}
