# Bridge Designer, Cloud Edition

This is a redesign and implementation as a web app of the Engineering Encounters Bridge Designer, formerly the West Point Bridge Designer. The latter were desktop apps originally in Visual Basic for Windows (circa 2000) and then Java (2003 through present) for Windows and Mac OSX. Our purpose is to make the app useful on more platforms, particularly Chromebooks, which are common in K-12 schools.

# Design considerations

BDCE is an Angular app with these goals and characteristics

- **Same UI:** Closely replicate the UI of the old implementations. The old UI works well. Teachers have lesson plans and knowledge based on it. We don't want to cause needless work.
- **Small devices:** Run well on minimal hardware. Chromebooks in schools are often minimally spec'ed and/or old.
- **Small host:** Put minimal load on the host. Host resources are dear to nil.

# Top-level technical choices

The following are key, top-level design choices:

- [**jqwidgets:**](https://www.jqwidgets.com/) BDCE uses jqwidgets as the primary UI library. It's full-featured, reasonably priced, free for development sans tech support, and not many bugs. On the other hand, the APIs are a bit quirky, limited and inconsistent. Documentation is mostly by example rather than explanation. This is inadequate when no example covers a needed use case. Reverse engineering and studying the mostly uncommented code are the only alternatives. The jqwidgets team apparently doesn't have a normal issues workflow. Their management tool is a community board. 

- **Stateful services**: Against common wisdom favoring central stores with pure reduction semantics, BDCE provides many services with mutable internal state. This supports "Small devices" above by reducing garbage collection pressure. It does complicate persistence across browswer refreshes. 
