import learnsdk


def test_version_is_semver() -> None:
    parts = learnsdk.__version__.split(".")
    assert len(parts) == 3
    assert all(p.isdigit() for p in parts)


def test_all_is_a_list() -> None:
    assert isinstance(learnsdk.__all__, list)
