// The ports have to be installed before expo-router evaluates any route: it
// requires them all up front, in an order the file tree decides, and a route
// that touches `@doska/core` at module scope would otherwise reach for a
// runtime that is not there yet.
import "./src/lib/adapters/install"

import "expo-router/entry"
